"use server";

import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { SalesGoal } from "@prisma/client";

export interface EnrichedSalesGoal extends SalesGoal {
    wonAmount: number;
    progressPct: number;
    user?: {
        id: string;
        name: string;
        email: string;
        image: string | null;
    } | null;
}

const GATEWAY_URL = process.env.API_GATEWAY_URL || "http://localhost:8080";

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
    const res = await fetch(`${GATEWAY_URL}/api/crm/goals`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
    const resData = await res.json();
    if (!res.ok) throw new Error(resData.error || "Failed to upsert sales goal");
    revalidatePath("/dashboard/admin/crm/goals");
    return { success: true, data: resData.data };
}

/** Eliminar meta */
export async function deleteSalesGoal(goalId: string) {
    await getSession();
    const res = await fetch(`${GATEWAY_URL}/api/crm/goals/${goalId}`, {
        method: "DELETE",
    });
    const resData = await res.json();
    if (!res.ok) throw new Error(resData.error || "Failed to delete sales goal");
    revalidatePath("/dashboard/admin/crm/goals");
    return { success: true };
}

/** Obtener todas las metas de la empresa + calcular progreso real desde deals WON */
export async function getSalesGoalsDashboard(companyId: string, period?: string): Promise<{
    goals: EnrichedSalesGoal[];
    period: string;
    totalWon: number;
    teamUsers: any[];
}> {
    const p = period ?? currentPeriod();
    const [year, month] = p.split("-").map(Number);

    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 0, 23, 59, 59);

    const [goalsRes, dealsRes, usersRes] = await Promise.all([
        fetch(`${GATEWAY_URL}/api/crm/goals?companyId=${companyId}&period=${p}`),
        fetch(`${GATEWAY_URL}/api/deals?companyId=${companyId}`),
        fetch(`${GATEWAY_URL}/api/crm/companies/${companyId}/users`),
    ]);

    const [goalsData, dealsData, usersData] = await Promise.all([
        goalsRes.json(),
        dealsRes.json(),
        usersRes.json(),
    ]);

    const goals = goalsData.data || [];
    const allDeals = dealsData.deals || [];
    const teamUsers = usersData.data || [];

    // Filter WON deals updated in the period in memory
    const wonDeals = allDeals.filter((d: any) => {
        if (d.stage !== "WON") return false;
        const upDate = new Date(d.updatedAt);
        return upDate >= startOfMonth && upDate <= endOfMonth;
    });

    // Calcular won amount global
    const totalWon = wonDeals.reduce((s: number, d: any) => s + d.value, 0);

    // Calcular won amount por user
    const wonByUser: Record<string, number> = {};
    for (const d of wonDeals) {
        // Can be d.assignedToUserId or d.assignedTo
        const userId = d.assignedToUserId || d.assignedTo;
        if (userId) {
            wonByUser[userId] = (wonByUser[userId] ?? 0) + d.value;
        }
    }

    // Enriquecer metas con progreso
    const enrichedGoals = goals.map((g: any) => {
        const wonAmount = g.userId ? (wonByUser[g.userId] ?? 0) : totalWon;
        return {
            ...g,
            wonAmount,
            progressPct: g.targetAmount > 0 ? Math.min(Math.round((wonAmount / g.targetAmount) * 100), 100) : 0,
        };
    });

    return {
        goals: enrichedGoals as EnrichedSalesGoal[],
        period: p,
        totalWon,
        teamUsers,
    };
}

/** Listar metas por user para selector */
export async function listSalesGoals(companyId: string) {
    const res = await fetch(`${GATEWAY_URL}/api/crm/goals?companyId=${companyId}`);
    const resData = await res.json();
    if (!res.ok) throw new Error(resData.error || "Failed to list sales goals");
    return resData.data;
}
