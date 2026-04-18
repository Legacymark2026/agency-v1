"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

async function requireAuth() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  return session.user;
}

export async function createSalesGoal(data: {
  level: "AGENCY" | "DEPARTMENT" | "TEAM" | "INDIVIDUAL";
  period: string; // YYYY-MM
  targetAmount: number;
  departmentId?: string;
  userId?: string;
}) {
  try {
    const user = await requireAuth();
    const cu = await prisma.companyUser.findFirst({ where: { userId: user.id }});
    if (!cu) throw new Error("No company linked");

    const goal = await (prisma as any).salesGoal.create({
      data: {
        companyId: cu.companyId,
        level: data.level,
        period: data.period,
        targetAmount: data.targetAmount,
        departmentId: data.departmentId,
        userId: data.userId
      }
    });

    revalidatePath("/dashboard/admin/sales/goals");
    return { success: true, goal };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getHierarchicalGoals(period: string) {
  try {
    const user = await requireAuth();
    const cu = await prisma.companyUser.findFirst({ where: { userId: user.id }});
    if (!cu) throw new Error("No company linked");

    const goals = await (prisma as any).salesGoal.findMany({
      where: { companyId: cu.companyId, period },
      include: {
        user: { select: { id: true, name: true, image: true, firstName: true, lastName: true } }
      },
      orderBy: [
        { level: "asc" },
        { targetAmount: "desc" }
      ]
    });

    const [year, month] = period.split("-").map(Number);
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0, 23, 59, 59);

    const wonDeals = await prisma.deal.findMany({
      where: {
        companyId: cu.companyId,
        probability: 100, // WON
        updatedAt: { gte: start, lte: end }
      },
      select: {
        id: true, value: true, assignedTo: true, probability: true
      }
    });

    return { success: true, goals, wonDeals };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
