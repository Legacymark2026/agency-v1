"use server";

import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

const GATEWAY_URL = process.env.API_GATEWAY_URL || "http://localhost:8080";

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
    const res = await fetch(`${GATEWAY_URL}/api/crm/commissions/rules`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
    const resData = await res.json();
    if (!res.ok) throw new Error(resData.error || "Failed to create commission rule");
    revalidatePath("/dashboard/admin/crm/commissions");
    return resData;
}

export async function updateCommissionRule(id: string, data: Partial<{
    rate: number; minDealValue: number; capAmount: number | null; isActive: boolean; label: string;
}>) {
    await getSession();
    const res = await fetch(`${GATEWAY_URL}/api/crm/commissions/rules/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
    const resData = await res.json();
    if (!res.ok) throw new Error(resData.error || "Failed to update commission rule");
    revalidatePath("/dashboard/admin/crm/commissions");
    return resData;
}

export async function deleteCommissionRule(id: string) {
    await getSession();
    const res = await fetch(`${GATEWAY_URL}/api/crm/commissions/rules/${id}`, {
        method: "DELETE",
    });
    const resData = await res.json();
    if (!res.ok) throw new Error(resData.error || "Failed to delete commission rule");
    revalidatePath("/dashboard/admin/crm/commissions");
    return { success: true };
}

export async function listCommissionRules(companyId: string) {
    const res = await fetch(`${GATEWAY_URL}/api/crm/commissions/rules?companyId=${companyId}`);
    const resData = await res.json();
    if (!res.ok) throw new Error(resData.error || "Failed to list commission rules");
    return resData.data;
}

// ─── PAGOS DE COMISIÓN ────────────────────────────────────────────────────────

/**
 * Calcular y crear automáticamente una CommissionPayment cuando un deal pasa a WON.
 * Busca la regla más específica (user-specific > global).
 */
export async function autoCreateCommission(dealId: string, companyId: string, assignedUserId: string | null) {
    if (!assignedUserId) return null;

    // Fetch deal from Gateway
    const dealRes = await fetch(`${GATEWAY_URL}/api/deals/${dealId}`);
    const dealData = await dealRes.json();
    if (!dealRes.ok || !dealData.deal) return null;
    const deal = dealData.deal;

    // Fetch rules from Gateway
    const rulesRes = await fetch(`${GATEWAY_URL}/api/crm/commissions/rules?companyId=${companyId}`);
    const rulesData = await rulesRes.json();
    if (!rulesRes.ok || !rulesData.data) return null;
    const rules = rulesData.data;

    // Filter and find matching rule in memory
    const matchingRules = rules.filter((r: any) =>
        r.isActive &&
        (r.minDealValue ?? 0) <= deal.value &&
        (r.userId === assignedUserId || r.userId === null)
    );

    // Sort: user-specific first (r.userId !== null first), then rate desc
    matchingRules.sort((a: any, b: any) => {
        const aUser = a.userId ? 1 : 0;
        const bUser = b.userId ? 1 : 0;
        if (aUser !== bUser) return bUser - aUser; // user-specific first
        return b.rate - a.rate;
    });

    const rule = matchingRules[0];
    if (!rule) return null;

    // Verify if already exists: fetch payments and check in-memory
    const paymentsRes = await fetch(`${GATEWAY_URL}/api/crm/commissions/payments?companyId=${companyId}`);
    const paymentsData = await paymentsRes.json();
    if (!paymentsRes.ok || !paymentsData.data) return null;
    const payments = paymentsData.data;

    const existing = payments.find((p: any) => p.dealId === dealId && p.userId === assignedUserId);
    if (existing) return existing;

    let amount = deal.value * rule.rate;
    if (rule.capAmount && amount > rule.capAmount) amount = rule.capAmount;

    const createRes = await fetch(`${GATEWAY_URL}/api/crm/commissions/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            companyId,
            dealId,
            userId: assignedUserId,
            ruleId: rule.id,
            amount,
            rate: rule.rate,
            status: "PENDING",
        }),
    });
    const createdData = await createRes.json();
    if (!createRes.ok) return null;

    revalidatePath("/dashboard/admin/crm/commissions");
    return createdData.data;
}

export async function updateCommissionStatus(id: string, status: "PENDING" | "APPROVED" | "PAID" | "CANCELLED") {
    await getSession();
    const res = await fetch(`${GATEWAY_URL}/api/crm/commissions/payments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            status,
            paidAt: status === "PAID" ? new Date() : null,
        }),
    });
    const resData = await res.json();
    if (!res.ok) throw new Error(resData.error || "Failed to update commission status");
    revalidatePath("/dashboard/admin/crm/commissions");
    return resData;
}

export async function getCommissionDashboard(companyId: string) {
    const [rulesRes, paymentsRes, usersRes] = await Promise.all([
        fetch(`${GATEWAY_URL}/api/crm/commissions/rules?companyId=${companyId}`),
        fetch(`${GATEWAY_URL}/api/crm/commissions/payments?companyId=${companyId}`),
        fetch(`${GATEWAY_URL}/api/crm/companies/${companyId}/users`),
    ]);

    const [rulesData, paymentsData, usersData] = await Promise.all([
        rulesRes.json(),
        paymentsRes.json(),
        usersRes.json(),
    ]);

    const rules = rulesData.data || [];
    const payments = paymentsData.data || [];
    const teamUsers = usersData.data || [];

    // Totales por vendedor
    const byUser: Record<string, { name: string; total: number; pending: number; paid: number; count: number }> = {};
    for (const p of payments) {
        if (!byUser[p.userId]) {
            byUser[p.userId] = { name: p.user?.name ?? p.user?.email ?? "?", total: 0, pending: 0, paid: 0, count: 0 };
        }
        byUser[p.userId].total += p.amount;
        byUser[p.userId].count++;
        if (p.status === "PENDING" || p.status === "APPROVED") byUser[p.userId].pending += p.amount;
        if (p.status === "PAID") byUser[p.userId].paid += p.amount;
    }

    const totals = {
        totalAmount: payments.reduce((s: number, p: any) => s + p.amount, 0),
        pendingAmount: payments.filter((p: any) => p.status === "PENDING").reduce((s: number, p: any) => s + p.amount, 0),
        paidAmount: payments.filter((p: any) => p.status === "PAID").reduce((s: number, p: any) => s + p.amount, 0),
    };

    return { rules, payments, byUser, totals, teamUsers };
}
