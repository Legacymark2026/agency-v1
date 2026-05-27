"use server";

import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { STAGES as BASE_STAGES } from "@/lib/crm-config";

const GATEWAY_URL = process.env.API_GATEWAY_URL || "http://localhost:8080";

async function getSession() {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");
    return session;
}

// ─── F3: ASIGNACIÓN DE VENDEDOR ────────────────────────────────────────────────

export async function assignDeal(dealId: string, userId: string | null) {
    const session = await getSession();
    // Update assignedTo via Gateway
    const patchRes = await fetch(`${GATEWAY_URL}/api/deals/${dealId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignedTo: userId })
    });
    if (!patchRes.ok) throw new Error("Failed to assign deal");

    // Log the assignment as an activity via Gateway
    let targetUserName = userId;
    if (userId) {
        try {
            const companyUsers = await getCompanyUsers(session.user.companyId ?? "");
            const targetUser = companyUsers.find((u: any) => u.id === userId);
            if (targetUser) targetUserName = targetUser.name;
        } catch (e) {
            console.error("Failed to retrieve target user name", e);
        }
    }
    const content = userId 
        ? `Deal asignado a ${targetUserName ?? userId}`
        : `Deal desasignado`;
    
    await fetch(`${GATEWAY_URL}/api/deals/${dealId}/activities`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            type: 'ASSIGNED',
            content,
            userId: session.user.id
        })
    });

    revalidatePath(`/dashboard/admin/crm/deals/${dealId}`);
    revalidatePath('/dashboard/admin/crm/pipeline');
    return { success: true };
}

export async function getCompanyUsers(companyId: string) {
    const response = await fetch(`${GATEWAY_URL}/api/crm/companies/${companyId}/users`);
    const resData = await response.json();
    if (!response.ok) throw new Error(resData.error || "Failed to fetch company users");
    return resData.data || [];
}

// ─── F5: HISTORIAL DE ETAPAS ───────────────────────────────────────────────────

export async function getDealStageHistory(dealId: string) {
    const response = await fetch(`${GATEWAY_URL}/api/crm/deals/${dealId}/stage-history`);
    const resData = await response.json();
    if (!response.ok) throw new Error(resData.error || "Failed to fetch stage history");
    return (resData.data || []).map((h: any) => ({
        ...h,
        createdAt: new Date(h.createdAt),
    }));
}

// ─── F4: COTIZADOR / PROPUESTAS ────────────────────────────────────────────────

export interface ProposalLineItem {
    description: string;
    quantity: number;
    unitPrice: number;
}

export async function createProposal(dealId: string, data: {
    title: string;
    validUntil?: string;
    notes?: string;
    lineItems: ProposalLineItem[];
}) {
    const session = await getSession();
    try {
        const response = await fetch(`${GATEWAY_URL}/api/crm/deals/${dealId}/proposals`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                title: data.title,
                validUntil: data.validUntil,
                notes: data.notes,
                lineItems: data.lineItems,
                creatorId: session.user.id
            })
        });
        const resData = await response.json();
        if (!response.ok) return { error: resData.error || "Failed to create proposal" };

        const total = data.lineItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
        await fetch(`${GATEWAY_URL}/api/deals/${dealId}/activities`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                type: 'PROPOSAL_CREATED',
                content: `Propuesta "${data.title}" creada por $${total.toLocaleString()}`,
                userId: session.user.id
            })
        });

        revalidatePath(`/dashboard/admin/crm/deals/${dealId}`);
        return { success: true, id: resData.data.id };
    } catch (error) {
        console.error(error);
        return { error: "Failed to create proposal" };
    }
}

export async function getProposalsByDeal(dealId: string) {
    try {
        const response = await fetch(`${GATEWAY_URL}/api/crm/deals/${dealId}/proposals`);
        const resData = await response.json();
        if (!response.ok) throw new Error(resData.error || "Failed to fetch proposals");
        return (resData.data || []).map((p: any) => ({
            ...p,
            createdAt: new Date(p.createdAt),
            updatedAt: new Date(p.updatedAt),
            validUntil: p.validUntil ? new Date(p.validUntil) : null,
        }));
    } catch {
        return [];
    }
}

export async function updateProposalStatus(proposalId: string, status: 'DRAFT' | 'SENT' | 'ACCEPTED' | 'REJECTED') {
    const session = await getSession();
    try {
        const response = await fetch(`${GATEWAY_URL}/api/crm/proposals/${proposalId}/status`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status })
        });
        const resData = await response.json();
        if (!response.ok) return { error: resData.error || "Not found" };
        const proposal = resData.data;

        const statusLabels: Record<string, string> = { DRAFT: 'Borrador', SENT: 'Enviada', ACCEPTED: 'Aceptada', REJECTED: 'Rechazada' };
        await fetch(`${GATEWAY_URL}/api/deals/${proposal.dealId}/activities`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                type: 'PROPOSAL_STATUS',
                content: `Propuesta "${proposal.title}" → ${statusLabels[status]}`,
                userId: session.user.id
            })
        });

        revalidatePath(`/dashboard/admin/crm/deals/${proposal.dealId}`);
        return { success: true };
    } catch {
        return { error: "Failed to update proposal status" };
    }
}

// ─── F7: VINCULACIÓN DEAL ↔ FACTURA ───────────────────────────────────────────

export async function createInvoiceFromDeal(dealId: string) {
    const session = await getSession();
    try {
        const response = await fetch(`${GATEWAY_URL}/api/crm/deals/${dealId}/invoices`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({})
        });
        const resData = await response.json();
        if (!response.ok) return { error: resData.error || "Failed to create invoice" };
        const invoice = resData.data;

        await fetch(`${GATEWAY_URL}/api/deals/${dealId}/activities`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                type: 'INVOICE_CREATED',
                content: `Factura #${invoice.id.slice(0, 8)} creada por $${invoice.totalAmount.toLocaleString()}`,
                userId: session.user.id
            })
        });

        revalidatePath(`/dashboard/admin/crm/deals/${dealId}`);
        return { success: true, invoiceId: invoice.id };
    } catch (error: any) {
        console.error("[createInvoiceFromDeal]", error);
        return { error: error.message ?? "Failed to create invoice" };
    }
}

export async function getInvoicesByDeal(dealId: string) {
    try {
        const response = await fetch(`${GATEWAY_URL}/api/crm/deals/${dealId}/invoices`);
        const resData = await response.json();
        if (!response.ok) throw new Error(resData.error || "Failed to fetch invoices");
        return (resData.data || []).map((inv: any) => ({
            ...inv,
            createdAt: new Date(inv.createdAt),
            dueDate: inv.dueDate ? new Date(inv.dueDate) : null,
        }));
    } catch {
        return [];
    }
}

// ─── F2/F6: ALERTAS DE STAGNACIÓN + REPORTE DE EMBUDO ─────────────────────────

export async function getStagnantDeals(companyId: string, thresholdDays = 7) {
    try {
        const response = await fetch(`${GATEWAY_URL}/api/crm/closing/stagnant-deals?companyId=${companyId}&thresholdDays=${thresholdDays}`);
        const resData = await response.json();
        if (!response.ok) throw new Error(resData.error || "Failed to fetch stagnant deals");
        return (resData.data || []).map((deal: any) => ({
            ...deal,
            lastActivity: deal.lastActivity ? new Date(deal.lastActivity) : null,
        }));
    } catch {
        return [];
    }
}

export async function getFunnelConversionReport(companyId: string) {
    try {
        const STAGES = [...BASE_STAGES.map(s => s.id), 'LOST'];
        const response = await fetch(`${GATEWAY_URL}/api/crm/closing/funnel-conversion-report?companyId=${companyId}&stages=${STAGES.join(',')}`);
        const resData = await response.json();
        if (!response.ok) throw new Error(resData.error || "Failed to fetch conversion report");
        return resData.data || [];
    } catch {
        return [];
    }
}
