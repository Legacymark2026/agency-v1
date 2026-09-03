"use server";

import { format, subDays, startOfMonth, endOfMonth } from "date-fns";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { rateLimit } from "@/lib/rate-limit";
import { sendGa4Event } from "@/lib/ga4-mp";
import { triggerWorkflow } from "@/actions/automation";
import { getAuthContext, authErrorToResponse } from "@/lib/auth-context";
import { dispatchConversion } from "@/lib/services/conversions/dispatcher";

const GATEWAY_URL = process.env.API_GATEWAY_URL || "http://localhost:8080";

// ─── AUTH ────────────────────────────────────────────────────────────────────

/**
 * @deprecated Usar getAuthContext() para validación completa con companyId y estado de empresa.
 * Mantenido para compatibilidad con acciones que aún no han sido migradas.
 */
async function checkAuth() {
    const session = await auth();
    if (!session?.user) return { error: "Unauthorized" };
    if (!session.user.companyId) return { error: "No company associated" };
    return null;
}

async function getUserId(): Promise<string> {
    const session = await auth();
    return session?.user?.id ?? "anonymous";
}

export interface TeamNode {
    id: string;
    name: string;
    parentId: string | null;
    children: TeamNode[];
    _count?: { members: number };
}

// ─── CRM DASHBOARD STATS (Modularized & Resilient) ───────────────────────────
export {
    getCRMStats,
    getSalesFunnel,
    getRecentActivity,
    getTopDeals,
    getHighPerformanceStats,
} from "@/modules/crm/actions/crm-stats.actions";

// ─── DEAL ACTIONS ─────────────────────────────────────────────────────────────

export async function updateDealStage(dealId: string, stage: string) {
    const session = await auth();
    if (!session?.user) return { error: "Unauthorized" };
    const companyId = session.user.companyId;
    if (!companyId) return { error: "No company associated" };
    const userId = session.user.id || "anonymous";

    try {
        // Fetch deals to find old deal details
        const dealsRes = await fetch(`${GATEWAY_URL}/api/deals?companyId=${companyId}`);
        const dealsResData = await dealsRes.json();
        const deals = dealsResData.deals || [];
        const oldDeal = deals.find((d: any) => d.id === dealId);
        if (!oldDeal) return { error: "Deal not found" };

        // Call gateway to update stage
        const updateRes = await fetch(`${GATEWAY_URL}/api/deals/${dealId}/stage`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ stage, userId })
        });
        const updateData = await updateRes.json();
        if (!updateRes.ok) return { error: updateData.error || "Failed to update deal stage" };
        const deal = updateData.deal;

        // ─── BI-DIRECTIONAL SYNC: Pipeline Stage → Lead Status ──────────
        const leadStatusMap: Record<string, string> = {
            'NEW': 'NEW', 'CONTACTED': 'CONTACTED', 'QUALIFIED': 'QUALIFIED',
            'PROPOSAL': 'QUALIFIED', 'NEGOTIATION': 'QUALIFIED',
            'WON': 'CONVERTED', 'LOST': 'LOST',
        };
        const newLeadStatus = leadStatusMap[stage];
        if (newLeadStatus) {
            const emailFromTitle = deal.title?.match(/^Lead:\s+(.+@.+\..+)$/i)?.[1]?.trim();
            const emailToSearch = deal.contactEmail || emailFromTitle;

            // Query matching leads via CRM sync parameters
            const syncParams = new URLSearchParams({
                companyId,
                syncDealId: dealId,
                ...(emailToSearch && { syncEmail: emailToSearch }),
            });
            const leadsRes = await fetch(`${GATEWAY_URL}/api/leads?${syncParams.toString()}`);
            const leadsResData = await leadsRes.json();
            const linkedLeads = leadsResData.leads || [];
            const toUpdate = linkedLeads.filter((l: any) => l.status !== newLeadStatus);

            if (toUpdate.length > 0) {
                await fetch(`${GATEWAY_URL}/api/leads/bulk-update`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        ids: toUpdate.map((l: any) => l.id),
                        companyId,
                        data: {
                            status: newLeadStatus,
                            ...(newLeadStatus === 'CONVERTED' ? { convertedAt: new Date() } : {})
                        }
                    })
                });
                revalidatePath("/dashboard/admin/crm/leads");
                console.log(`[Pipeline→Lead Sync] ✅ Deal "${deal.title}" → stage ${stage} → updated ${toUpdate.length} lead(s) to "${newLeadStatus}"`);
            }
        }

        // ─── E: Auto-crear Comisión cuando deal = WON ────────────────
        if (stage === "WON") {
            try {
                if (deal.assignedToUserId) {
                    const { autoCreateCommission } = await import("@/actions/crm-commissions");
                    await autoCreateCommission(dealId, companyId, deal.assignedToUserId);
                }
            } catch (commErr) {
                console.warn("[AutoCommission] Non-fatal error:", commErr);
            }
        }

        // FASE 7: Broad Audience Training (S2S) FOR ALL DEAL STAGES
        if (companyId) {
            const syncParams = new URLSearchParams({
                companyId,
                syncDealId: dealId,
            });
            const leadsRes = await fetch(`${GATEWAY_URL}/api/leads?${syncParams.toString()}`);
            const leadsResData = await leadsRes.json();
            const lead = (leadsResData.leads || [])[0];

            const targetEmail = lead?.email || deal.contactEmail;
            const leadId = lead?.id || `deal_${dealId}`;

            const stageToCAPIEvent: Record<string, string> = {
                WON:         'Purchase',
                CONTACTED:   'Contact',
                QUALIFIED:   'QualifiedLead',
                PROPOSAL:    'Contact',
                NEGOTIATION: 'CustomizeProduct',
            };
            const stageToValue: Record<string, number> = {
                WON:         deal.value,
                CONTACTED:   10,
                QUALIFIED:   50,
                PROPOSAL:    150,
                NEGOTIATION: 300,
            };

            const capiEvent = stageToCAPIEvent[stage];
            if (capiEvent && targetEmail) {
                const stageValue = stageToValue[stage] ?? 0;
                triggerCRMConversion({
                    leadId,
                    eventName: capiEvent,
                    value:     stageValue,
                    companyId,
                    userData: {
                        email:     targetEmail,
                        phone:     lead?.phone,
                        firstName: (lead?.name || deal.contactName)?.split(' ')[0],
                        lastName:  (lead?.name || deal.contactName)?.split(' ').slice(1).join(' '),
                        ip:        lead?.ipAddress,
                        userAgent: lead?.userAgent,
                        fbclid:    lead?.fbclid,
                        fbc:       lead?.fbc,
                        fbp:       lead?.fbp,
                        gclid:     lead?.gclid,
                        ttclid:    lead?.ttclid,
                        li_fat_id: lead?.li_fat_id,
                    }
                });
            }
        }

        // ─── AUTOMATION ENGINE ───
        triggerWorkflow('DEAL_STAGE_CHANGED', {
            stage,
            dealId: deal.id,
            dealTitle: deal.title,
            dealValue: deal.value,
            companyName: companyId,
            contactEmail: deal.contactEmail,
            contactName: deal.contactName,
            assignedTo: deal.assignedToUserId || deal.assignedTo,
        }).catch(e => console.error('[AutoEngine] DEAL_STAGE_CHANGED trigger failed:', e));

        revalidatePath("/dashboard/admin/crm");
        return { success: true };
    } catch (error) {
        console.error(error);
        return { error: "Failed to update deal" };
    }
}

export async function updateDeal(dealId: string, data: Record<string, unknown>) {
    const session = await auth();
    if (!session?.user) return { error: "Unauthorized" };
    try {
        const response = await fetch(`${GATEWAY_URL}/api/deals/${dealId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        const resData = await response.json();
        if (!response.ok) return { error: resData.error || "Failed to update deal" };
        revalidatePath("/dashboard/admin/crm");
        return { success: true };
    } catch (error) {
        console.error(error);
        return { error: "Failed to update deal" };
    }
}

export async function deleteDeal(dealId: string) {
    const session = await auth();
    if (!session?.user) return { error: "Unauthorized" };
    try {
        const response = await fetch(`${GATEWAY_URL}/api/deals/${dealId}`, {
            method: 'DELETE'
        });
        const resData = await response.json();
        if (!response.ok) return { error: resData.error || "Failed to delete deal" };
        revalidatePath("/dashboard/admin/crm");
        return { success: true };
    } catch (error) {
        console.error(error);
        return { error: "Failed to delete deal" };
    }
}

export async function createDeal(data: Record<string, unknown>) {
    const session = await auth();
    if (!session?.user) return { error: "Unauthorized" };
    const userId = session.user.id || "anonymous";
    const allowed = await rateLimit(`create_deal:${userId}`, 5, 60_000);
    if (!allowed) return { error: "Demasiadas peticiones. Espera un momento." };

    const { enforceQuota } = await import("@/lib/quotas");
    const companyId = data.companyId as string;
    
    // Obtenemos tier directamente desde la DB (por seguridad vs enviarlo desde el cliente) via API Gateway
    const companyRes = await fetch(`${GATEWAY_URL}/api/crm/companies/${companyId}`);
    const companyData = await companyRes.json();
    if (!companyRes.ok || !companyData.data) return { error: "Tenant B2B no localizado." };
    const company = companyData.data;
    
    const quota = await enforceQuota(companyId, "leads", company.subscriptionTier);
    if (!quota.allowed) {
        return { error: `Has superado las operaciones permitidas en tu plan ${company.subscriptionTier.toUpperCase()} (${quota.limit}/mes). Ve a Configuración > Facturación para aumentar tus límites.` };
    }

    try {
        const response = await fetch(`${GATEWAY_URL}/api/deals`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        const resData = await response.json();
        if (!response.ok) return { error: resData.error || "Failed to create deal" };

        const dealId = resData.id;

        // FASE 7: Broad Audience Training: Dispatch Lead event for new deal creation
        if (companyId && data.contactEmail) {
            triggerCRMConversion({
                leadId:    `deal_${dealId}`,
                eventName: 'Lead',
                value:     0,
                companyId,
                userData: {
                    email:     data.contactEmail as string,
                    phone:     data.contactPhone as string | undefined,
                    firstName: (data.contactName as string)?.split(' ')[0],
                    lastName:  (data.contactName as string)?.split(' ').slice(1).join(' '),
                }
            });
        }

        revalidatePath("/dashboard/admin/crm");
        revalidatePath("/dashboard/admin/crm/pipeline");
        return { success: true, id: dealId };
    } catch (error) {
        console.error(error);
        return { error: "Failed to create deal" };
    }
}

// ─── LEAD ACTIONS ─────────────────────────────────────────────────────────────

export interface LeadFilters {
    status?: string;
    source?: string;
    scoreMin?: number;
    scoreMax?: number;
    assignedTo?: string;
    search?: string;
    page?: number;
    pageSize?: number;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
}

export async function getLeads(companyId: string, filters: LeadFilters = {}) {
    const { status, source, scoreMin = 0, scoreMax = 100, search, page = 1, pageSize = 20, sortBy = "createdAt", sortOrder = "desc" } = filters;

    try {
        const queryParams = new URLSearchParams({
            companyId,
            scoreMin: scoreMin.toString(),
            scoreMax: scoreMax.toString(),
            page: page.toString(),
            pageSize: pageSize.toString(),
            sortBy,
            sortOrder,
            ...(status && { status }),
            ...(source && { source }),
            ...(search && { search }),
        });

        const response = await fetch(`${GATEWAY_URL}/api/leads?${queryParams.toString()}`);
        const resData = await response.json();
        if (!response.ok) return { error: resData.error || "Failed to fetch leads" };

        return {
            leads: resData.leads,
            total: resData.total,
            pages: resData.pages,
            page: resData.page
        };
    } catch (error) {
        console.error(error);
        return { error: "Failed to fetch leads" };
    }
}

export async function getLeadById(id: string) {
    try {
        const response = await fetch(`${GATEWAY_URL}/api/leads/${id}`);
        const resData = await response.json();
        if (!response.ok) return { error: resData.error || "Lead not found" };
        return { lead: resData.lead };
    } catch (error) {
        console.error("[getLeadById] Failed:", error);
        return { error: "Failed to fetch lead" };
    }
}

export async function updateLead(id: string, data: Record<string, unknown>) {
    const session = await auth();
    if (!session?.user) return { error: "Unauthorized" };
    const companyId = session.user.companyId;
    if (!companyId) return { error: "No company associated" };

    try {
        const oldLeadRes = await fetch(`${GATEWAY_URL}/api/leads/${id}`);
        const oldLeadData = await oldLeadRes.json();
        if (!oldLeadRes.ok) return { error: oldLeadData.error || "Lead not found" };
        const oldLead = oldLeadData.lead;

        const response = await fetch(`${GATEWAY_URL}/api/leads/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        const resData = await response.json();
        if (!response.ok) return { error: resData.error || "Failed to update lead" };
        const lead = resData.lead;

        // FASE 7: Broad Audience Training: Meta, TikTok, GA4, LinkedIn triggers for Lead Lifecycle
        const isStatusChanged = data.status && data.status !== oldLead?.status;
        
        if (isStatusChanged) {
            const userData = {
                email: lead.email,
                phone: lead.phone,
                firstName: lead.name?.split(' ')[0],
                lastName: lead.name?.split(' ').slice(1).join(' '),
                fbc: lead.fbc,
                fbp: lead.fbp,
            };

            if (data.status === "QUALIFIED") {
                triggerCRMConversion({ leadId: lead.id, eventName: 'QualifiedLead', value: 50, companyId, userData });
            } else if (data.status === "CONTACTED") {
                triggerCRMConversion({ leadId: lead.id, eventName: 'Contact', value: 10, companyId, userData });
            } else if (data.status === "NEW") {
                triggerCRMConversion({ leadId: lead.id, eventName: 'Lead', value: 0, companyId, userData });
            }

            // ─── SYNC: Lead Status → Pipeline Deal Stage ────────────────────
            const leadStatusToDealStage: Record<string, string> = {
                'NEW': 'NEW',
                'CONTACTED': 'CONTACTED',
                'QUALIFIED': 'QUALIFIED',
                'CONVERTED': 'WON',
                'LOST': 'LOST',
            };
            const newDealStage = leadStatusToDealStage[data.status as string];
            if (newDealStage && lead.email) {
                const queryParams = new URLSearchParams({
                    companyId,
                });
                const dealsRes = await fetch(`${GATEWAY_URL}/api/deals?${queryParams.toString()}`);
                const dealsResData = await dealsRes.json();
                const deals = dealsResData.deals || [];
                const linkedDeals = deals.filter((d: any) =>
                    d.contactEmail?.toLowerCase() === lead.email.toLowerCase() &&
                    d.stage !== newDealStage
                );

                if (linkedDeals.length > 0) {
                    for (const d of linkedDeals) {
                        await fetch(`${GATEWAY_URL}/api/deals/${d.id}`, {
                            method: 'PATCH',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ stage: newDealStage })
                        });
                    }
                    revalidatePath("/dashboard/admin/crm/pipeline");
                }
            }
        }

        revalidatePath(`/dashboard/admin/crm/leads/${id}`);
        revalidatePath("/dashboard/admin/crm/leads");
        return { success: true };
    } catch (error) {
        console.error(error);
        return { error: "Failed to update lead" };
    }
}

export async function bulkUpdateLeads(ids: string[], data: Record<string, unknown>) {
    const ctx = await getAuthContext().catch(authErrorToResponse);
    if ('error' in ctx) return ctx;
    const { companyId } = ctx;
    try {
        const response = await fetch(`${GATEWAY_URL}/api/leads/bulk-update`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ids, data, companyId })
        });
        const resData = await response.json();
        if (!response.ok) return { error: resData.error || "Failed to bulk update leads" };
        revalidatePath("/dashboard/admin/crm/leads");
        return { success: true, count: resData.count };
    } catch (error) {
        console.error(error);
        return { error: "Failed to bulk update leads" };
    }
}

export async function convertLeadToDeal(leadId: string, dealData: { title: string; value: number; companyId: string; probability?: number; expectedClose?: string }) {
    const session = await auth();
    if (!session?.user) return { error: "Unauthorized" };
    try {
        const response = await fetch(`${GATEWAY_URL}/api/leads/convert-to-deal`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ leadId, dealData })
        });
        const resData = await response.json();
        if (!response.ok) return { error: resData.error || "Failed to convert lead to deal" };

        revalidatePath("/dashboard/admin/crm/leads");
        revalidatePath("/dashboard/admin/crm/pipeline");
        return { success: true, dealId: resData.dealId };
    } catch (error) {
        console.error(error);
        return { error: "Failed to convert lead to deal" };
    }
}

export async function createLead(data: {
    email: string; name?: string; phone?: string; company?: string;
    source: string; message?: string; companyId: string;
    utmSource?: string; utmMedium?: string; utmCampaign?: string;
    formData?: Record<string, unknown>;
    pipelineStage?: string;
}) {
    const session = await auth();
    if (!session?.user) return { error: "Unauthorized" };
    const userId = session.user.id || "anonymous";
    const allowed = await rateLimit(`create_lead:${userId}`, 20, 60_000);
    if (!allowed) return { error: "Demasiadas peticiones. Espera un momento." };

    const { enforceQuota } = await import("@/lib/quotas");
    const companyRes = await fetch(`${GATEWAY_URL}/api/crm/companies/${data.companyId}`);
    const companyData = await companyRes.json();
    if (!companyRes.ok || !companyData.data) return { error: "Tenant no localizado." };
    const company = companyData.data;

    const quota = await enforceQuota(data.companyId, "leads", company.subscriptionTier);
    if (!quota.allowed) {
        return { error: `Has superado el límite de leads en tu plan ${company.subscriptionTier.toUpperCase()} (${quota.limit}/mes). Ve a Configuración > Facturación para aumentar tus límites.` };
    }

    try {
        const leadStatusMap: Record<string, string> = {
            NEW: 'NEW', CONTACTED: 'CONTACTED', QUALIFIED: 'QUALIFIED',
            PROPOSAL: 'QUALIFIED', NEGOTIATION: 'QUALIFIED', WON: 'CONVERTED',
        };
        const dealStage = data.pipelineStage || 'NEW';
        const leadStatus = leadStatusMap[dealStage] || 'NEW';

        const leadRes = await fetch(`${GATEWAY_URL}/api/leads`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: data.email,
                name: data.name || "",
                phone: data.phone,
                company: data.company,
                source: data.source,
                message: data.message,
                companyId: data.companyId,
                utmSource: data.utmSource,
                utmMedium: data.utmMedium,
                utmCampaign: data.utmCampaign,
                formData: data.formData ?? {},
                status: leadStatus,
                score: 0,
            })
        });
        const leadResData = await leadRes.json();
        if (!leadRes.ok) return { error: leadResData.error || "Failed to create lead" };
        const lead = leadResData.lead;

        const dealRes = await fetch(`${GATEWAY_URL}/api/deals`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                title: data.name ? `Lead: ${data.name}` : `Lead: ${data.email}`,
                value: 0,
                stage: dealStage,
                priority: "MEDIUM",
                contactName: data.name || "",
                contactEmail: data.email,
                source: data.source || "Unknown",
                companyId: data.companyId,
            })
        });
        const dealResData = await dealRes.json();
        if (!dealRes.ok) return { error: dealResData.error || "Failed to create deal" };

        revalidatePath("/dashboard/admin/crm/leads");
        revalidatePath("/dashboard/admin/crm/pipeline");
        return { success: true, id: lead.id };
    } catch (error) {
        console.error(error);
        return { error: "Failed to create lead" };
    }
}

export async function checkDuplicateEmail(email: string, companyId: string): Promise<{ isDuplicate: boolean; leadId?: string; leadName?: string }> {
    try {
        const queryParams = new URLSearchParams({
            companyId,
            search: email,
        });
        const response = await fetch(`${GATEWAY_URL}/api/leads?${queryParams.toString()}`);
        if (!response.ok) return { isDuplicate: false };
        const resData = await response.json();
        const leads = resData.leads || [];
        const existing = leads.find((l: any) => l.email?.toLowerCase() === email.toLowerCase());
        if (existing) return { isDuplicate: true, leadId: existing.id, leadName: existing.name ?? undefined };
        return { isDuplicate: false };
    } catch {
        return { isDuplicate: false };
    }
}

// ─── ACTIVITY ACTIONS ─────────────────────────────────────────────────────────

export async function createDealActivity(dealId: string, type: string, content: string) {
    const session = await auth();
    if (!session?.user) return { error: "Unauthorized" };
    const userId = session.user.id || "anonymous";
    try {
        const response = await fetch(`${GATEWAY_URL}/api/deals/${dealId}/activities`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type, content, userId })
        });
        const resData = await response.json();
        if (!response.ok) return { error: resData.error || "Failed to create activity" };
        revalidatePath("/dashboard/admin/crm");
        return { success: true };
    } catch (error) {
        console.error(error);
        return { error: "Failed to create activity" };
    }
}

export async function getDealActivities(dealId: string) {
    const session = await auth();
    if (!session?.user) return [];
    try {
        const response = await fetch(`${GATEWAY_URL}/api/deals/${dealId}/activities`);
        if (!response.ok) return [];
        return await response.json();
    } catch {
        return [];
    }
}

// ─── CAMPAIGN ACTIONS ─────────────────────────────────────────────────────────

export async function getCampaigns(companyId: string) {
    const authCheck = await checkAuth();
    if (authCheck) return { error: "Unauthorized" };
    try {
        const response = await fetch(`${GATEWAY_URL}/api/campaigns?companyId=${companyId}`);
        const resData = await response.json();
        if (!response.ok) throw new Error(resData.error || "Failed to fetch campaigns");
        const campaigns = resData.data || [];
        return campaigns;
    } catch (error) {
        console.error(error);
        return { error: "Failed to fetch campaigns" };
    }
}

export async function createCampaign(data: {
    name: string; code: string; platform: string; budget?: number;
    startDate?: string; endDate?: string; description?: string; companyId: string;
}) {
    const authCheck = await checkAuth();
    if (authCheck) return { error: "Unauthorized" };
    try {
        const response = await fetch(`${GATEWAY_URL}/api/campaigns`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: data.name,
                code: data.code,
                platform: data.platform,
                budget: data.budget,
                startDate: data.startDate,
                endDate: data.endDate,
                description: data.description,
                companyId: data.companyId,
            })
        });
        const resData = await response.json();
        if (!response.ok) return { error: resData.error || "Failed to create campaign" };
        return { success: true, id: resData.data.id };
    } catch (error) {
        console.error(error);
        return { error: "Failed to create campaign" };
    }
}

export async function updateCampaignMetrics(id: string, metrics: { impressions?: number; clicks?: number; conversions?: number; spend?: number }) {
    const authCheck = await checkAuth();
    if (authCheck) return { error: "Unauthorized" };
    try {
        const response = await fetch(`${GATEWAY_URL}/api/campaigns/${id}/metrics`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(metrics)
        });
        if (!response.ok) {
            const resData = await response.json();
            return { error: resData.error || "Failed to update metrics" };
        }
        revalidatePath("/dashboard/admin/crm/campaigns");
        return { success: true };
    } catch (error) {
        console.error(error);
        return { error: "Failed to update metrics" };
    }
}

export async function updateCampaignStatus(id: string, status: "ACTIVE" | "PAUSED" | "COMPLETED") {
    const authCheck = await checkAuth();
    if (authCheck) return { error: "Unauthorized" };
    try {
        const response = await fetch(`${GATEWAY_URL}/api/campaigns/${id}/status`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status })
        });
        if (!response.ok) {
            const resData = await response.json();
            return { error: resData.error || "Failed to update campaign status" };
        }
        revalidatePath("/dashboard/admin/crm/campaigns");
        return { success: true };
    } catch (error) {
        console.error(error);
        return { error: "Failed to update campaign status" };
    }
}

// ─── MISC ─────────────────────────────────────────────────────────────────────

export async function createTeam(name: string, companyId: string, parentId?: string) {
    const authCheck = await checkAuth();
    if (authCheck) return { error: "Unauthorized" };
    try {
        const response = await fetch(`${GATEWAY_URL}/api/crm/teams`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, companyId, parentId })
        });
        if (!response.ok) {
            const resData = await response.json();
            return { error: resData.error || "Failed to create team" };
        }
        revalidatePath("/dashboard/admin/crm");
        return { success: true };
    } catch (error) {
        console.error(error);
        return { error: "Failed to create team" };
    }
}

export async function createCustomObjectDefinition(data: { name: string; label?: string; description?: string; companyId: string; apiName?: string }) {
    const authCheck = await checkAuth();
    if (authCheck) return { error: "Unauthorized" };
    try {
        const response = await fetch(`${GATEWAY_URL}/api/crm/custom-objects`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!response.ok) {
            const resData = await response.json();
            return { error: resData.error || "Failed to create custom object definition" };
        }
        revalidatePath("/dashboard/admin/crm");
        return { success: true };
    } catch (error) {
        console.error(error);
        return { error: "Failed to create custom object definition" };
    }
}

// ─── PRIVATE HELPERS ──────────────────────────────────────────────────────────

/**
 * Canonical CRM S2S conversion trigger.
 * Delegates to the primary dispatcher which handles all 4 platforms with:
 *   ✅ external_id (SHA-256 leadId)
 *   ✅ dynamic action_source
 *   ✅ ttp cookie for TikTok
 *   ✅ LinkedIn multi-conversionId
 *   ✅ event_id deduplication for Meta
 * Fire-and-forget — does NOT block the caller.
 */
function triggerCRMConversion(args: {
    leadId: string;
    eventName: string;
    value: number;
    companyId: string;
    currency?: string;
    userData: Parameters<typeof dispatchConversion>[0]['userData'];
}) {
    dispatchConversion({
        leadId:    args.leadId,
        eventName: args.eventName,
        value:     args.value,
        currency:  args.currency ?? 'USD',
        timestamp: Date.now(),
        userData:  args.userData,
    }, args.companyId).catch(err =>
        console.error('[CRM CAPI] Conversion dispatch failed:', err)
    );
}
