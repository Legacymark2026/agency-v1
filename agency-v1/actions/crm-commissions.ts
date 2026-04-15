"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

async function getSession() {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");
    return session;
}

// ─── REGLAS DE COMISIÓN ───────────────────────────────────────────────────────

export async function createCommissionRule(data: {
    companyId: string;
    userId?: string | null;
    rate: number;          // 0.05 = 5%
    minDealValue?: number;
    capAmount?: number | null;
    label?: string;
}) {
    await getSession();
    const rule = await prisma.commissionRule.create({
        data: {
            companyId: data.companyId,
            userId: data.userId ?? null,
            rate: data.rate,
            minDealValue: data.minDealValue ?? 0,
            capAmount: data.capAmount ?? null,
            label: data.label,
        },
    });
    revalidatePath("/dashboard/admin/crm/commissions");
    return { success: true, data: rule };
}

export async function updateCommissionRule(id: string, data: Partial<{
    rate: number; minDealValue: number; capAmount: number | null; isActive: boolean; label: string;
}>) {
    await getSession();
    const rule = await prisma.commissionRule.update({ where: { id }, data });
    revalidatePath("/dashboard/admin/crm/commissions");
    return { success: true, data: rule };
}

export async function deleteCommissionRule(id: string) {
    await getSession();
    await prisma.commissionRule.delete({ where: { id } });
    revalidatePath("/dashboard/admin/crm/commissions");
    return { success: true };
}

export async function listCommissionRules(companyId: string) {
    return prisma.commissionRule.findMany({
        where: { companyId },
        include: { user: { select: { id: true, name: true, email: true } } },
        orderBy: { rate: "desc" },
    });
}

// ─── PAGOS DE COMISIÓN ────────────────────────────────────────────────────────

/**
 * Calcular y crear automáticamente una ComissionPayment cuando un deal pasa a WON.
 * Busca la regla más específica (user-specific > global).
 */
export async function autoCreateCommission(dealId: string, companyId: string, assignedUserId: string | null) {
    if (!assignedUserId) return null;

    const deal = await prisma.deal.findUnique({ where: { id: dealId } });
    if (!deal) return null;

    // Buscar regla: primero específica del user, luego global
    const rule = await prisma.commissionRule.findFirst({
        where: {
            companyId,
            isActive: true,
            minDealValue: { lte: deal.value },
            OR: [{ userId: assignedUserId }, { userId: null }],
        },
        orderBy: [
            { userId: "desc" }, // user-specific first
            { rate: "desc" },
        ],
    });

    if (!rule) return null;

    // Verificar si ya existe pago para este deal + user
    const existing = await prisma.commissionPayment.findFirst({
        where: { dealId, userId: assignedUserId },
    });
    if (existing) return existing;

    let amount = deal.value * rule.rate;
    if (rule.capAmount && amount > rule.capAmount) amount = rule.capAmount;

    const payment = await prisma.commissionPayment.create({
        data: {
            companyId,
            dealId,
            userId: assignedUserId,
            ruleId: rule.id,
            amount,
            rate: rule.rate,
            status: "PENDING",
        },
    });

    revalidatePath("/dashboard/admin/crm/commissions");
    return payment;
}

export async function updateCommissionStatus(id: string, status: "PENDING" | "APPROVED" | "PAID" | "CANCELLED") {
    await getSession();
    const payment = await prisma.commissionPayment.update({
        where: { id },
        data: {
            status,
            paidAt: status === "PAID" ? new Date() : null,
        },
    });
    revalidatePath("/dashboard/admin/crm/commissions");
    return { success: true, data: payment };
}

export async function getCommissionDashboard(companyId: string) {
    const [rules, payments, users] = await Promise.all([
        prisma.commissionRule.findMany({
            where: { companyId },
            include: { user: { select: { id: true, name: true } } },
        }),
        prisma.commissionPayment.findMany({
            where: { companyId },
            include: {
                user: { select: { id: true, name: true, email: true, image: true } },
                deal: { select: { id: true, title: true, value: true, stage: true } },
            },
            orderBy: { createdAt: "desc" },
            take: 100,
        }),
        prisma.companyUser.findMany({
            where: { companyId },
            include: { user: { select: { id: true, name: true } } },
        }),
    ]);

    // Totales por vendedor
    const byUser: Record<string, { name: string; total: number; pending: number; paid: number; count: number }> = {};
    for (const p of payments) {
        if (!byUser[p.userId]) {
            byUser[p.userId] = { name: p.user.name ?? p.user.email ?? "?", total: 0, pending: 0, paid: 0, count: 0 };
        }
        byUser[p.userId].total += p.amount;
        byUser[p.userId].count++;
        if (p.status === "PENDING" || p.status === "APPROVED") byUser[p.userId].pending += p.amount;
        if (p.status === "PAID") byUser[p.userId].paid += p.amount;
    }

    const totals = {
        totalAmount: payments.reduce((s, p) => s + p.amount, 0),
        pendingAmount: payments.filter(p => p.status === "PENDING").reduce((s, p) => s + p.amount, 0),
        paidAmount: payments.filter(p => p.status === "PAID").reduce((s, p) => s + p.amount, 0),
    };

    return { rules, payments, byUser, totals, teamUsers: users.map(u => u.user) };
}
