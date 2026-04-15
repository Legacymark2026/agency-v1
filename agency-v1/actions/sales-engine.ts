"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

async function requireAuth() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  return session.user;
}

export async function calculateCommissions(dealId: string) {
  try {
    const user = await requireAuth();
    const cu = await prisma.companyUser.findFirst({ where: { userId: user.id }});
    if (!cu) throw new Error("No company linked");

    // Get Deal
    const deal = await prisma.deal.findUnique({
      where: { id: dealId },
      include: {
        assignedUser: true
      }
    });

    if (!deal || !deal.assignedTo) throw new Error("Deal or owner not found");
    if (deal.probability < 100) return { success: true, message: "Deal not WON yet" };

    // Get Commission Rule for the user (or global)
    const rule = await (prisma as any).commissionRule.findFirst({
      where: { 
        companyId: cu.companyId, 
        isActive: true,
        OR: [{ userId: deal.assignedTo }, { userId: null }] 
      },
      orderBy: { userId: "desc" } // Prefer user-specific over global
    });

    if (!rule) return { success: false, error: "No active commission rule found" };

    // Calculate base commission
    let rate = rule.rate;
    let type = "STANDARD";

    // 1. Aceleradores (Accelerator)
    const period = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`;
    const userGoal = await (prisma as any).salesGoal.findFirst({
      where: { companyId: cu.companyId, userId: deal.assignedTo, period }
    });

    if (userGoal && userGoal.targetAmount > 0) {
      // Check how much they have sold already
      const start = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
      const end = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0, 23, 59, 59);

      const wonDealsAgg = await prisma.deal.aggregate({
        where: {
          companyId: cu.companyId,
          assignedTo: deal.assignedTo,
          probability: 100,
          updatedAt: { gte: start, lte: end }
        },
        _sum: { value: true }
      });

      const currentTotal = wonDealsAgg._sum.value || 0;
      if (currentTotal > userGoal.targetAmount) {
        rate = rate * 1.5; // Accelerator! +50% bump on the commission rate
        type = "ACCELERATOR";
      }
    }

    let amount = deal.value * rate;
    if (rule.capAmount && amount > rule.capAmount) {
      amount = rule.capAmount;
    }

    // 2. Create Commission Record
    const commission = await (prisma as any).commissionPayment.create({
      data: {
        companyId: cu.companyId,
        dealId: deal.id,
        userId: deal.assignedTo,
        ruleId: rule.id,
        amount: Math.round(amount * 100) / 100,
        rate: rate,
        type: type,
        status: "PENDING"
      }
    });

    revalidatePath("/dashboard/admin/sales/goals");
    return { success: true, commission };

  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function processClawback(dealId: string, reason: string) {
  try {
    const user = await requireAuth();
    const cu = await prisma.companyUser.findFirst({ where: { userId: user.id }});
    if (!cu) throw new Error("No company linked");

    // Find existing commission for this deal
    const existing = await (prisma as any).commissionPayment.findFirst({
      where: { dealId, companyId: cu.companyId, status: { not: "CANCELLED" } }
    });

    if (!existing) return { success: false, error: "No commission found to clawback" };

    // Reverse it
    const clawback = await (prisma as any).commissionPayment.create({
      data: {
        companyId: cu.companyId,
        dealId: dealId,
        userId: existing.userId,
        ruleId: existing.ruleId,
        amount: -Math.abs(existing.amount), 
        rate: existing.rate,
        type: "CLAWBACK",
        status: "APPROVED",
        notes: `Clawback: ${reason}`
      }
    });

    // Mark original as cancelled if not paid
    if (existing.status === "PENDING") {
      await (prisma as any).commissionPayment.update({
        where: { id: existing.id },
        data: { status: "CANCELLED" }
      });
    }

    revalidatePath("/dashboard/admin/sales/goals");
    return { success: true, clawback };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
