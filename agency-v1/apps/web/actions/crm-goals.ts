"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

// ─── Helpers ─────────────────────────────────────────────────────────────────
async function getSession() {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");
    return session;
}

function currentPeriod(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

// ─── CRUD METAS ──────────────────────────────────────────────────────────────

/** Crear o actualizar meta de ventas (upsert por companyId + userId + period) */
export async function upsertSalesGoal(data: {
    companyId: string;
    userId: string | null;
    period: string;       // "YYYY-MM"
    targetAmount: number;
    label?: string;
    currency?: string;
}) {
    await getSession();
    const goal = await prisma.salesGoal.upsert({
        where: {
            companyId_userId_period: {
                companyId: data.companyId,
                userId: data.userId ?? "",  // userId null is treated as ""
                period: data.period,
            },
        },
        update: { targetAmount: data.targetAmount, label: data.label },
        create: {
            companyId: data.companyId,
            userId: data.userId,
            period: data.period,
            targetAmount: data.targetAmount,
            currency: data.currency ?? "USD",
            label: data.label,
        },
    });
    revalidatePath("/dashboard/admin/crm/goals");
    return { success: true, data: goal };
}

/** Eliminar meta */
export async function deleteSalesGoal(goalId: string) {
    await getSession();
    await prisma.salesGoal.delete({ where: { id: goalId } });
    revalidatePath("/dashboard/admin/crm/goals");
    return { success: true };
}

/** Obtener todas las metas de la empresa + calcular progreso real desde deals WON */
export async function getSalesGoalsDashboard(companyId: string, period?: string) {
    const p = period ?? currentPeriod();
    const [year, month] = p.split("-").map(Number);

    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 0, 23, 59, 59);

    const [goals, wonDeals, users] = await Promise.all([
        prisma.salesGoal.findMany({
            where: { companyId, period: p },
            include: { user: { select: { id: true, name: true, email: true, image: true } } },
            orderBy: { targetAmount: "desc" },
        }),
        prisma.deal.findMany({
            where: {
                companyId,
                stage: "WON",
                updatedAt: { gte: startOfMonth, lte: endOfMonth },
            },
            select: { id: true, value: true, assignedTo: true },
        }),
        prisma.companyUser.findMany({
            where: { companyId },
            include: { user: { select: { id: true, name: true, email: true, image: true } } },
        }),
    ]);

    // Calcular won amount global
    const totalWon = wonDeals.reduce((s, d) => s + d.value, 0);

    // Calcular won amount por user
    const wonByUser: Record<string, number> = {};
    for (const d of wonDeals) {
        if (d.assignedTo) {
            wonByUser[d.assignedTo] = (wonByUser[d.assignedTo] ?? 0) + d.value;
        }
    }

    // Enriquecer metas con progreso
    const enrichedGoals = goals.map(g => {
        const wonAmount = g.userId ? (wonByUser[g.userId] ?? 0) : totalWon;
        return {
            ...g,
            wonAmount,
            progressPct: g.targetAmount > 0 ? Math.min(Math.round((wonAmount / g.targetAmount) * 100), 100) : 0,
        };
    });

    return {
        goals: enrichedGoals,
        period: p,
        totalWon,
        teamUsers: users.map(u => u.user),
    };
}

/** Listar metas por user para selector */
export async function listSalesGoals(companyId: string) {
    return prisma.salesGoal.findMany({
        where: { companyId },
        include: { user: { select: { id: true, name: true } } },
        orderBy: [{ period: "desc" }, { targetAmount: "desc" }],
    });
}
