"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { STAGES as BASE_STAGES } from "@/lib/crm-config";

async function getSession() {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");
    return session;
}

// ─── F3: ASIGNACIÓN DE VENDEDOR ────────────────────────────────────────────────

export async function assignDeal(dealId: string, userId: string | null) {
    const session = await getSession();
    const oldDeal = await prisma.deal.findUnique({ where: { id: dealId }, select: { assignedTo: true } });
    
    await prisma.deal.update({
        where: { id: dealId },
        data: { assignedTo: userId, updatedAt: new Date() }
    });

    // Log the assignment as an activity
    const targetUser = userId ? await prisma.user.findUnique({ where: { id: userId }, select: { name: true } }) : null;
    const content = userId 
        ? `Deal asignado a ${targetUser?.name ?? userId}`
        : `Deal desasignado`;
    
    await prisma.cRMActivity.create({
        data: { dealId, type: 'ASSIGNED', content, userId: session.user.id }
    });

    revalidatePath(`/dashboard/admin/crm/deals/${dealId}`);
    revalidatePath('/dashboard/admin/crm/pipeline');
    return { success: true };
}

export async function getCompanyUsers(companyId: string) {
    const companyUsers = await prisma.companyUser.findMany({
        where: { companyId },
        include: { user: { select: { id: true, name: true, email: true, image: true } } }
    });
    return companyUsers.map(cu => cu.user);
}

// ─── F5: HISTORIAL DE ETAPAS ───────────────────────────────────────────────────

export async function getDealStageHistory(dealId: string) {
    return prisma.dealStageHistory.findMany({
        where: { dealId },
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { id: true, name: true, image: true } } }
    });
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
    const deal = await prisma.deal.findUnique({ where: { id: dealId }, select: { companyId: true, title: true } });
    if (!deal) return { error: "Deal not found" };

    const total = data.lineItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);

    try {
        const proposal = await prisma.proposal.create({
            data: {
                title: data.title,
                dealId,
                companyId: deal.companyId,
                status: 'DRAFT',
                value: total,
                validUntil: data.validUntil ? new Date(data.validUntil) : undefined,
                notes: data.notes,
                items: {
                    create: data.lineItems.map(item => ({
                        title: item.description,
                        quantity: item.quantity,
                        price: item.unitPrice,
                    }))
                },
                creatorId: session.user.id,
            } as any
        });

        await prisma.cRMActivity.create({
            data: {
                dealId, type: 'PROPOSAL_CREATED',
                content: `Propuesta "${data.title}" creada por $${total.toLocaleString()}`,
                userId: session.user.id
            }
        });

        revalidatePath(`/dashboard/admin/crm/deals/${dealId}`);
        return { success: true, id: proposal.id };
    } catch (error) {
        console.error(error);
        return { error: "Failed to create proposal" };
    }
}

export async function getProposalsByDeal(dealId: string) {
    try {
        return await prisma.proposal.findMany({
            where: { dealId },
            orderBy: { createdAt: 'desc' },
        });
    } catch {
        return [];
    }
}

export async function updateProposalStatus(proposalId: string, status: 'DRAFT' | 'SENT' | 'ACCEPTED' | 'REJECTED') {
    const session = await getSession();
    const proposal = await prisma.proposal.findUnique({ where: { id: proposalId }, select: { dealId: true, title: true } });
    if (!proposal) return { error: "Not found" };

    await prisma.proposal.update({ where: { id: proposalId }, data: { status } });
    
    const statusLabels: Record<string, string> = { DRAFT: 'Borrador', SENT: 'Enviada', ACCEPTED: 'Aceptada', REJECTED: 'Rechazada' };
    await prisma.cRMActivity.create({
        data: {
            dealId: proposal.dealId ?? undefined, type: 'PROPOSAL_STATUS',
            content: `Propuesta "${proposal.title}" → ${statusLabels[status]}`,
            userId: session.user.id
        } as any
    });

    revalidatePath(`/dashboard/admin/crm/deals/${proposal.dealId}`);
    return { success: true };
}

// ─── F7: VINCULACIÓN DEAL ↔ FACTURA ───────────────────────────────────────────

export async function createInvoiceFromDeal(dealId: string) {
    const session = await getSession();
    const deal = await prisma.deal.findUnique({
        where: { id: dealId },
        select: { id: true, title: true, value: true, companyId: true, contactEmail: true, contactName: true }
    });
    if (!deal) return { error: "Deal not found" };

    try {
        const invoice = await prisma.invoice.create({
            data: {
                clientName: deal.contactName || 'Cliente',
                serviceDescription: deal.title,
                subtotalAmount: deal.value,
                taxAmount: 0,
                totalAmount: deal.value,
                advanceAmount: 0,
                finalAmount: deal.value,
                status: 'DRAFT_AWAITING_PAYMENT',
                companyId: deal.companyId,
                dealId: deal.id,
                currency: 'USD',
                dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                items: {
                    create: [{
                        title: deal.title,
                        quantity: 1,
                        unitPrice: deal.value,
                        totalAmount: deal.value,
                    }]
                }
            }
        });

        await prisma.cRMActivity.create({
            data: {
                dealId, type: 'INVOICE_CREATED',
                content: `Factura #${invoice.id.slice(0, 8)} creada por $${deal.value.toLocaleString()}`,
                userId: session.user.id
            }
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
        return await prisma.invoice.findMany({
            where: { dealId },
            orderBy: { createdAt: 'desc' },
            select: { id: true, serviceDescription: true, status: true, totalAmount: true, dueDate: true, createdAt: true }
        });
    } catch {
        return [];
    }
}

// ─── F2/F6: ALERTAS DE STAGNACIÓN + REPORTE DE EMBUDO ─────────────────────────

export async function getStagnantDeals(companyId: string, thresholdDays = 7) {
    const cutoff = new Date(Date.now() - thresholdDays * 24 * 60 * 60 * 1000);
    return prisma.deal.findMany({
        where: {
            companyId,
            stage: { notIn: ['WON', 'LOST'] },
            lastActivity: { lt: cutoff }
        },
        select: { id: true, title: true, value: true, stage: true, lastActivity: true, contactName: true, assignedUser: { select: { name: true } } },
        orderBy: { lastActivity: 'asc' }
    });
}

export async function getFunnelConversionReport(companyId: string) {
    const STAGES = [...BASE_STAGES.map(s => s.id), 'LOST'];
    
    // Count deals per stage
    const stageCounts = await prisma.deal.groupBy({
        by: ['stage'],
        where: { companyId },
        _count: { stage: true },
        _sum: { value: true },
    });

    // Avg days in each stage from stage history
    let avgDaysByStage: Record<string, number> = {};
    try {
        const historyData = await prisma.dealStageHistory.groupBy({
            by: ['toStage'],
            where: { deal: { companyId } },
            _count: { toStage: true },
        });
        // Simple approximation: time from entry to exit for each stage
        avgDaysByStage = Object.fromEntries(STAGES.map(s => [s, 0]));
    } catch {
        avgDaysByStage = Object.fromEntries(STAGES.map(s => [s, 0]));
    }

    const stageData = STAGES.map((stage, i) => {
        const row = stageCounts.find(r => r.stage === stage);
        const count = row?._count.stage ?? 0;
        const value = row?._sum.value ?? 0;
        const prevCount = i > 0 ? (stageCounts.find(r => r.stage === STAGES[i - 1])?._count.stage ?? 0) : count;
        const conversionRate = prevCount > 0 ? Math.round((count / prevCount) * 100) : 0;
        return { stage, count, value, conversionRate, avgDays: avgDaysByStage[stage] ?? 0 };
    });

    return stageData;
}
