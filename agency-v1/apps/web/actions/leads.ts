'use server';

import { revalidatePath } from "next/cache";
import { detectLeadSource, parseUTMParams, calculateLeadScore, type UTMParams } from "@/lib/lead-source-detector";
import { sendGa4Event } from "@/lib/ga4-mp";
import { auth } from "@/lib/auth";
import { Permission, ROLE_PERMISSIONS, UserRole } from "@/types/auth";
import { dispatchConversion } from "@/lib/services/conversions/dispatcher";
import { notifyUsers } from "@/lib/notifications/notification-engine";
import { enforceQuota } from "@/lib/quotas";
import crypto from "crypto";
import { predictLeadConversion, LeadFeatures } from "@/lib/ml/lead-scoring-model";

const GATEWAY_URL = process.env.API_GATEWAY_URL || "http://localhost:8080";

/**
 * CRM Stage → Ad Platform Event mapping.
 *
 * Each entry defines:
 *  - event:    Meta/TikTok-compatible event name (used as canonical name)
 *  - ga4Event: GA4 snake_case event name (GA4 Measurement Protocol)
 *  - value:    Estimated lead value for the stage (overridden by deal.value for WON)
 *
 * WHY TWO NAMES:
 *  Meta CAPI expects PascalCase standard events (Lead, Purchase, CompleteRegistration).
 *  GA4 Measurement Protocol expects snake_case per GA4 spec (generate_lead, qualify_lead).
 *  The dispatcher routes each event name to the correct platform format.
 */
const CRM_VBO_STAGES: Record<string, { event: string; ga4Event: string; value: number }> = {
  NEW:           { event: 'Lead',                  ga4Event: 'generate_lead',       value: 0 },
  CONTACTED:     { event: 'Lead',                  ga4Event: 'generate_lead',       value: 10 },
  QUALIFIED:     { event: 'QualifiedLead',          ga4Event: 'qualify_lead',        value: 50 },
  PROPOSAL:      { event: 'Contact',               ga4Event: 'generate_lead',       value: 150 },
  NEGOTIATION:   { event: 'CustomizeProduct',       ga4Event: 'view_item',           value: 300 },
  WON:           { event: 'Purchase',              ga4Event: 'purchase',            value: 0 },  // value overridden by deal.value
  LOST:          { event: 'DisqualifiedLead',       ga4Event: 'refund',              value: 0 },
  DISQUALIFIED:  { event: 'DisqualifiedLead',       ga4Event: 'refund',              value: 0 },
};

/**
 * Validates if the current user has permission to manage leads.
 * Supports granular string scopes from custom UI roles.
 */
async function checkLeadPermission(action: 'manage' | 'edit' | 'delete' | 'export' = 'manage') {
    const session = await auth();
    if (!session?.user) return false;

    // Check custom UI (string) permissions first
    const uiPerms = (session.user.permissions as string[]) || [];

    // Always allow if they have legacy manage_leads or the new super scope
    if (uiPerms.includes(Permission.MANAGE_LEADS) || uiPerms.includes("manage_settings")) {
        // Though manage_settings is global, we can fallback to role below.
    }

    // Granular UI permission matching
    if (action === 'delete' && uiPerms.includes("crm.delete")) return true;
    if (action === 'edit' && (uiPerms.includes("crm.edit") || uiPerms.includes("crm.manage"))) return true;
    if (action === 'export' && uiPerms.includes("crm.export")) return true;
    if (action === 'manage' && (uiPerms.includes("crm.edit") || uiPerms.includes("crm.delete") || uiPerms.includes(Permission.MANAGE_LEADS))) return true;

    // Legacy fallback using static Role Matrix
    const role = session.user.role as UserRole;
    if (role && ROLE_PERMISSIONS[role]?.includes(Permission.MANAGE_LEADS)) {
        return true;
    }

    return false;
}

// ==================== LEAD TYPES ====================

export type Lead = {
    id: string;
    name: string | null;
    email: string;
    phone: string | null;
    company: string | null;
    jobTitle: string | null;
    source: string;
    medium: string | null;
    utmSource: string | null;
    utmMedium: string | null;
    utmCampaign: string | null;
    utmTerm: string | null;
    utmContent: string | null;
    referer: string | null;
    landingPage: string | null;
    campaignId: string | null;
    status: string;
    score: number;
    gclid?: string | null;
    fbclid?: string | null;
    li_fat_id?: string | null;
    ttclid?: string | null;
    fbp?: string | null;
    fbc?: string | null;
    ipAddress?: string | null;
    userAgent?: string | null;
    createdAt: Date;
};

export type Campaign = {
    id: string;
    name: string;
    code: string;
    platform: string;
    status: string;
    budget: number | null;
    startDate: Date | null;
    endDate: Date | null;
    impressions: number;
    clicks: number;
    conversions: number;
    spend: number;
    createdAt: Date;
};

// ==================== LEAD ACTIONS ====================

export interface CreateLeadInput {
    // Required
    email: string;
    companyId: string;

    // Contact info
    name?: string;
    phone?: string;
    company?: string;
    jobTitle?: string;
    message?: string;

    // UTM & Tracking (can be auto-detected)
    utmSource?: string;
    utmMedium?: string;
    utmCampaign?: string;
    utmTerm?: string;
    utmContent?: string;
    referer?: string;
    landingPage?: string;

    // Campaign attribution
    campaignCode?: string;

    // Browser & device fingerprint
    formId?: string;
    formData?: Record<string, any>;
    ipAddress?: string;
    userAgent?: string;
    tags?: string[];

    // ─── Click IDs & Cookies (First-Party Data) ─────────────────────────────────
    fbclid?: string;
    fbp?: string;
    fbc?: string;
    gclid?: string;
    ttclid?: string;
    ttp?: string;
    li_fat_id?: string;
    gaClientId?: string;
}

/**
 * Create a new lead with automatic source detection
 */
export async function createLead(input: CreateLeadInput) {
    try {
        // ─ Verificar cuota de leads del plan ────────────────────────────────
        const companyRes = await fetch(`${GATEWAY_URL}/api/crm/companies/${input.companyId}`);
        const companyData = await companyRes.json();
        const tier = companyData.data?.subscriptionTier || 'free';

        const leadQuota = await enforceQuota(input.companyId, 'leads', tier);
        if (!leadQuota.allowed) {
            return {
                success: false,
                error: `Límite de leads alcanzado para el plan ${tier.toUpperCase()} (máx. ${leadQuota.limit.toLocaleString()}). Mejora tu plan para continuar.`,
            };
        }

        // Build UTM params object
        const utmParams: UTMParams = {
            utm_source: input.utmSource,
            utm_medium: input.utmMedium,
            utm_campaign: input.utmCampaign,
            utm_term: input.utmTerm,
            utm_content: input.utmContent,
        };

        // Detect source
        const sourceResult = detectLeadSource(utmParams, input.referer);

        // Try to match campaign by code or utm_campaign
        let campaignId: string | undefined;
        const campaignCode = input.campaignCode || input.utmCampaign;

        if (campaignCode) {
            const campaignsRes = await fetch(`${GATEWAY_URL}/api/campaigns?companyId=${input.companyId}`);
            const campaignsData = await campaignsRes.json();
            const campaigns = campaignsData.data || [];
            const campaign = campaigns.find((c: any) =>
                c.code.toLowerCase() === campaignCode.toLowerCase()
            );
            if (campaign) {
                campaignId = campaign.id;
                // Increment campaign conversions
                await fetch(`${GATEWAY_URL}/api/campaigns/${campaign.id}/metrics`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ conversions: (campaign.conversions || 0) + 1 })
                });
            }
        }

        // Calculate lead score (Legacy logic)
        const score = calculateLeadScore({
            email: input.email,
            name: input.name,
            phone: input.phone,
            company: input.company,
            jobTitle: input.jobTitle,
            source: sourceResult.source,
        });

        // 🤖 Machine Learning Predictive Scoring
        const mlFeatures: LeadFeatures = {
            source: sourceResult.source || 'Direct',
            hasEmail: !!input.email,
            hasPhone: !!input.phone,
            hasName: !!input.name,
            hasCompany: !!input.company,
            hasFacebookClickId: !!input.fbclid || !!input.fbc,
            hasGoogleClickId: !!input.gclid,
            hasLinkedInClickId: !!input.li_fat_id,
            hasTikTokClickId: !!input.ttclid,
        };
        const mlPrediction = predictLeadConversion(mlFeatures);

        // Create the lead via API Gateway workload
        const response = await fetch(`${GATEWAY_URL}/api/leads`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: input.email,
                name: input.name,
                phone: input.phone,
                company: input.company,
                jobTitle: input.jobTitle,
                message: input.message,
                source: sourceResult.source,
                medium: sourceResult.medium,
                utmSource: sourceResult.utmSource || input.utmSource,
                utmMedium: sourceResult.utmMedium || input.utmMedium,
                utmCampaign: sourceResult.utmCampaign || input.utmCampaign,
                utmTerm: sourceResult.utmTerm || input.utmTerm,
                utmContent: sourceResult.utmContent || input.utmContent,
                referer: input.referer,
                landingPage: input.landingPage,
                campaignId,
                ipAddress: input.ipAddress,
                userAgent: input.userAgent,
                formId: input.formId,
                formData: input.formData,
                tags: input.tags || [],
                score,
                fbclid: input.fbclid,
                fbp:    input.fbp,
                fbc:    input.fbc || (input.fbclid ? `fb.1.${Date.now()}.${input.fbclid}` : undefined),
                gclid:  input.gclid,
                ttclid: input.ttclid,
                li_fat_id: input.li_fat_id,
                conversionProbability: mlPrediction.probability,
                predictionFactors: mlPrediction.factors,
                companyId: input.companyId,
            })
        });

        const resData = await response.json();
        if (!response.ok) {
            return { success: false, error: resData.error || "Failed to create lead via gateway" };
        }
        const lead = resData.lead;

        // ─── S2S Conversion Dispatch — Lead Created ──────────────────────────────
        dispatchConversion({
            leadId: lead.id,
            eventName: 'Lead',
            value: 0,
            currency: 'USD',
            timestamp: Date.now(),
            userData: {
                email:     input.email,
                phone:     input.phone,
                firstName: input.name ? input.name.split(' ')[0] : undefined,
                lastName:  input.name ? input.name.split(' ').slice(1).join(' ') : undefined,
                ip:        input.ipAddress,
                userAgent: input.userAgent,
                fbclid:    input.fbclid,
                fbc:       input.fbc || (input.fbclid ? `fb.1.${Date.now()}.${input.fbclid}` : undefined),
                fbp:       input.fbp,
                gclid:     input.gclid,
                ttclid:    input.ttclid,
                li_fat_id: input.li_fat_id,
            },
        }, input.companyId).catch(err =>
            console.error('[LeadsAction] S2S dispatch failed on lead create:', err)
        );

        // ─── GA4 Measurement Protocol — generate_lead ────────────────────────────
        sendGa4Event(input.companyId, {
            eventName: 'generate_lead',
            clientId: input.gaClientId,
            userData: {
                email:     input.email,
                phone:     input.phone || undefined,
                firstName: input.name ? input.name.split(' ')[0] : undefined,
                lastName:  input.name ? input.name.split(' ').slice(1).join(' ') : undefined,
            },
            eventParams: {
                lead_source: sourceResult.source,
                lead_score:  score,
                lead_status: 'NEW',
            }
        }).catch(err => console.error('[LeadsAction] GA4-MP failed:', err));

        // ─── Enterprise Notification — Lead Created ─────────────────────────────
        notifyUsers("CRM.LEAD_CREATED", {
            companyId: input.companyId,
            title: "Nuevo Lead Recibido",
            message: `${input.name || "Sin nombre"} desde ${sourceResult.source}. ${input.email}`,
            roles: ["super_admin", "admin", "content_manager"],
            data: { leadId: lead.id },
        }).catch((e) => console.error("[LeadsAction] Notification failed:", e));

        revalidatePath('/dashboard/admin/crm/leads');
        return { success: true, data: lead };
    } catch (error: any) {
        console.error("Error creating lead:", error);
        return { success: false, error: error.message };
    }
}

/**
 * Get all leads for a company
 */
export async function getLeads(companyId: string, options?: {
    source?: string;
    status?: string;
    campaignId?: string;
    limit?: number;
}) {
    try {
        const queryParams = new URLSearchParams({
            companyId,
            ...(options?.status && { status: options.status }),
            ...(options?.source && { source: options.source }),
            ...(options?.limit && { pageSize: options.limit.toString() }),
        });
        const response = await fetch(`${GATEWAY_URL}/api/leads?${queryParams.toString()}`);
        const resData = await response.json();
        if (!response.ok) throw new Error(resData.error || "Failed to fetch leads");
        return { success: true, data: resData.leads };
    } catch (error: any) {
        console.error("Error fetching leads:", error);
        return { success: false, error: error.message };
    }
}

/**
 * Update lead status
 */
export async function updateLeadStatus(leadId: string, status: string) {
    try {
        const hasPermission = await checkLeadPermission('edit');
        if (!hasPermission) return { success: false, error: "Unauthorized to manage leads" };

        const leadResponse = await fetch(`${GATEWAY_URL}/api/leads/${leadId}`);
        const leadData = await leadResponse.json();
        if (!leadResponse.ok) return { success: false, error: leadData.error || "Lead not found" };
        const lead = leadData.lead;

        let dealId = lead.convertedToDealId;
        const dealStages = ['NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION', 'WON', 'LOST'];

        if (dealStages.includes(status) && !dealId) {
            const dealResponse = await fetch(`${GATEWAY_URL}/api/deals`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: `Deal - ${lead.name || lead.email}`,
                    value: 0,
                    stage: status,
                    contactName: lead.name,
                    contactEmail: lead.email,
                    source: lead.source,
                    priority: lead.score >= 70 ? 'HIGH' : lead.score >= 40 ? 'MEDIUM' : 'LOW',
                    companyId: lead.companyId,
                })
            });
            const dealRes = await dealResponse.json();
            if (dealResponse.ok) {
                dealId = dealRes.id;
            }
        } else if (dealId && dealStages.includes(status)) {
            await fetch(`${GATEWAY_URL}/api/deals/${dealId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ stage: status })
            });
        }

        const dataToUpdate: any = { status };
        if (dealId && !lead.convertedToDealId) {
            dataToUpdate.convertedToDealId = dealId;
            dataToUpdate.convertedAt = new Date();
        }

        const updateResponse = await fetch(`${GATEWAY_URL}/api/leads/${leadId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dataToUpdate)
        });
        const updateRes = await updateResponse.json();
        if (!updateResponse.ok) return { success: false, error: updateRes.error || "Failed to update lead status" };
        const updatedLead = updateRes.lead;

        // Trigger S2S Conversions if status maps to VBO Stage
        const vboStage = CRM_VBO_STAGES[status];
        if (vboStage) {
            let eventValue = vboStage.value;

            if (status === 'WON' && dealId) {
                const dealResponse = await fetch(`${GATEWAY_URL}/api/deals?companyId=${lead.companyId}`);
                const dealsData = await dealResponse.json();
                const deal = dealsData.deals?.find((d: any) => d.id === dealId);
                if (deal) eventValue = deal.value;
            }

            dispatchConversion({
                leadId: lead.id,
                eventName: vboStage.event,
                value: eventValue,
                currency: "USD",
                timestamp: Date.now(),
                userData: {
                    email:     lead.email,
                    phone:     lead.phone,
                    firstName: lead.name ? lead.name.split(' ')[0] : undefined,
                    lastName:  lead.name ? lead.name.split(' ').slice(1).join(' ') : undefined,
                    ip:        lead.ipAddress,
                    userAgent: lead.userAgent,
                    gclid:     lead.gclid,
                    fbclid:    lead.fbclid,
                    li_fat_id: lead.li_fat_id,
                    ttclid:    lead.ttclid,
                    fbp:       lead.fbp,
                    fbc:       lead.fbc,
                }
            }, lead.companyId).catch(e => console.error("[S2S Dispatcher] Background error:", e));

            sendGa4Event(lead.companyId, {
                eventName: vboStage.ga4Event,
                eventParams: {
                    lead_status: status,
                    lead_score:  lead.score,
                    value:       eventValue,
                    currency:    'USD',
                    ...(lead.gclid && { gclid: lead.gclid }),
                },
                userData: {
                    email:     lead.email,
                    phone:     lead.phone ?? undefined,
                    firstName: lead.name ? lead.name.split(' ')[0] : undefined,
                    lastName:  lead.name ? lead.name.split(' ').slice(1).join(' ') : undefined,
                },
            }).catch(e => console.error('[GA4-MP] Stage event failed:', e));
        }

        revalidatePath('/dashboard/admin/crm/leads');
        revalidatePath('/dashboard/admin/crm/pipeline');

        // Enterprise Notifications — Stage Changed
        if (status === "WON") {
            notifyUsers("SALES.DEAL_WON", {
                companyId: lead.companyId,
                title: "¡Deal Cerrado! 🎉",
                message: `${lead.name || lead.email} — ${status}`,
                roles: ["super_admin", "admin"],
                data: { dealId: dealId || "", leadId: lead.id },
            }).catch(() => {});
        } else if (status === "LOST") {
            notifyUsers("SALES.DEAL_LOST", {
                companyId: lead.companyId,
                title: "Deal Perdido",
                message: `${lead.name || lead.email} — marcado como perdido`,
                roles: ["super_admin", "admin"],
                data: { dealId: dealId || "", leadId: lead.id },
            }).catch(() => {});
        } else {
            notifyUsers("CRM.STAGE_CHANGED", {
                companyId: lead.companyId,
                title: `Lead → ${status}`,
                message: `${lead.name || lead.email} movido a etapa ${status}`,
                roles: ["super_admin", "admin"],
                data: { leadId: lead.id },
            }).catch(() => {});
        }

        return { success: true, data: updatedLead };
    } catch (error: any) {
        console.error(error);
        return { success: false, error: error.message };
    }
}

/**
 * Update lead score
 */
export async function updateLeadScore(leadId: string, score: number) {
    try {
        const hasPermission = await checkLeadPermission('edit');
        if (!hasPermission) return { success: false, error: "Unauthorized to manage leads" };

        const response = await fetch(`${GATEWAY_URL}/api/leads/${leadId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ score })
        });
        const resData = await response.json();
        if (!response.ok) return { success: false, error: resData.error || "Failed to update score" };

        revalidatePath('/dashboard/admin/crm/leads');
        revalidatePath(`/dashboard/admin/crm/leads/${leadId}`);
        return { success: true, data: resData.lead };
    } catch (error: any) {
        console.error(error);
        return { success: false, error: error.message };
    }
}

/**
 * Convert lead to deal
 */
export async function convertLeadToDeal(leadId: string, dealData: {
    title: string;
    value: number;
    stage?: string;
}) {
    try {
        const hasPermission = await checkLeadPermission('edit');
        if (!hasPermission) return { success: false, error: "Unauthorized to manage leads" };

        const leadResponse = await fetch(`${GATEWAY_URL}/api/leads/${leadId}`);
        const leadDataRes = await leadResponse.json();
        if (!leadResponse.ok) return { success: false, error: leadDataRes.error || "Lead not found" };
        const lead = leadDataRes.lead;

        const response = await fetch(`${GATEWAY_URL}/api/leads/convert-to-deal`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                leadId,
                dealData: {
                    title: dealData.title,
                    value: dealData.value,
                    stage: dealData.stage || 'NEW',
                    companyId: lead.companyId,
                }
            })
        });
        const resData = await response.json();
        if (!response.ok) return { success: false, error: resData.error || "Failed to convert lead" };

        dispatchConversion({
            leadId: lead.id,
            eventName: 'Purchase',
            value: dealData.value,
            currency: "USD",
            timestamp: Date.now(),
            userData: {
                email: lead.email,
                phone: lead.phone,
                ip: lead.ipAddress,
                userAgent: lead.userAgent,
                gclid: lead.gclid,
                fbclid: lead.fbclid,
                li_fat_id: lead.li_fat_id,
                ttclid: lead.ttclid,
                fbp: lead.fbp,
                fbc: lead.fbc
            }
        }, lead.companyId).catch(e => console.error("S2S Dispatcher Background Error:", e));

        revalidatePath('/dashboard/admin/crm/leads');
        revalidatePath('/dashboard/admin/crm/pipeline');
        return { success: true, data: { id: resData.dealId } };
    } catch (error: any) {
        console.error(error);
        return { success: false, error: error.message };
    }
}

/**
 * Delete a lead unconditionally
 */
export async function deleteLead(leadId: string) {
    try {
        const hasPermission = await checkLeadPermission('delete');
        if (!hasPermission) return { success: false, error: "Unauthorized to delete leads" };

        const response = await fetch(`${GATEWAY_URL}/api/leads/${leadId}`, {
            method: 'DELETE'
        });
        const resData = await response.json();
        if (!response.ok) return { success: false, error: resData.error || "Failed to delete lead" };

        revalidatePath('/dashboard/admin/crm/pipeline');
        revalidatePath('/dashboard/admin/crm');
        revalidatePath('/dashboard/admin/crm/leads');
        return { success: true };
    } catch (error: any) {
        console.error(error);
        return { success: false, error: error.message };
    }
}

/**
 * Get lead analytics by source
 */
export async function getLeadAnalyticsBySource(companyId: string) {
    try {
        const response = await fetch(`${GATEWAY_URL}/api/leads/analytics/source?companyId=${companyId}`);
        const resData = await response.json();
        if (!response.ok) return { success: false, error: resData.error || "Failed to fetch analytics" };
        return resData;
    } catch (error: any) {
        console.error(error);
        return { success: false, error: error.message };
    }
}

// ==================== CAMPAIGN ACTIONS ====================

export interface CreateCampaignInput {
    name: string;
    code: string;
    platform: string;
    companyId: string;
    description?: string;
    budget?: number;
    startDate?: Date;
    endDate?: Date;
}

/**
 * Create a new campaign
 */
export async function createCampaign(input: CreateCampaignInput) {
    try {
        // ─ Verificar cuota de campañas del plan ───────────────────────────
        const companyRes = await fetch(`${GATEWAY_URL}/api/crm/companies/${input.companyId}`);
        const companyData = await companyRes.json();
        const tier = companyData.data?.subscriptionTier || 'free';

        const campaignQuota = await enforceQuota(input.companyId, 'campaigns', tier);
        if (!campaignQuota.allowed) {
            return {
                success: false,
                error: `Límite de campañas alcanzado para el plan ${tier.toUpperCase()} (máx. ${campaignQuota.limit}). Mejora tu plan para continuar.`,
            };
        }

        const res = await fetch(`${GATEWAY_URL}/api/campaigns`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: input.name,
                code: input.code,
                platform: input.platform,
                description: input.description,
                budget: input.budget,
                startDate: input.startDate,
                endDate: input.endDate,
                companyId: input.companyId,
            })
        });
        const resData = await res.json();
        if (!res.ok) throw new Error(resData.error || "Failed to create campaign");
        const campaign = resData.data;

        revalidatePath('/dashboard/admin/crm/campaigns');
        return { success: true, data: campaign };
    } catch (error: any) /* eslint-disable-line @typescript-eslint/no-explicit-any */ {
        console.error("Error creating campaign:", error);
        return { success: false, error: error.message };
    }
}

/**
 * Get all campaigns for a company
 */
export async function getCampaigns(companyId: string, status?: string) {
    try {
        const res = await fetch(`${GATEWAY_URL}/api/campaigns?companyId=${companyId}${status ? `&status=${status}` : ''}`);
        const resData = await res.json();
        if (!res.ok) throw new Error(resData.error || "Failed to list campaigns");
        const campaigns = resData.data || [];
        return { success: true, data: campaigns };
    } catch (error: any) /* eslint-disable-line @typescript-eslint/no-explicit-any */ {
        console.error(error);
        return { success: false, error: error.message };
    }
}

/**
 * Update campaign
 */
export async function updateCampaign(campaignId: string, data: Partial<Campaign>) {
    try {
        const res = await fetch(`${GATEWAY_URL}/api/campaigns/${campaignId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        const resData = await res.json();
        if (!res.ok) throw new Error(resData.error || "Failed to update campaign");
        const campaign = resData.data;

        revalidatePath('/dashboard/admin/crm/campaigns');
        return { success: true, data: campaign };
    } catch (error: any) /* eslint-disable-line @typescript-eslint/no-explicit-any */ {
        console.error(error);
        return { success: false, error: error.message };
    }
}

/**
 * Delete campaign
 */
export async function deleteCampaign(campaignId: string) {
    try {
        const res = await fetch(`${GATEWAY_URL}/api/campaigns/${campaignId}`, {
            method: 'DELETE'
        });
        const resData = await res.json();
        if (!res.ok) throw new Error(resData.error || "Failed to delete campaign");

        revalidatePath('/dashboard/admin/crm/campaigns');
        return { success: true };
    } catch (error: any) /* eslint-disable-line @typescript-eslint/no-explicit-any */ {
        console.error(error);
        return { success: false, error: error.message };
    }
}

/**
 * Get campaign performance metrics
 */
export async function getCampaignMetrics(campaignId: string) {
    try {
        const res = await fetch(`${GATEWAY_URL}/api/campaigns/${campaignId}/metrics`);
        const resData = await res.json();
        if (!res.ok) return { success: false, error: resData.error || "Campaign not found" };
        const metrics = resData.data;
        return { success: true, data: metrics };
    } catch (error: any) /* eslint-disable-line @typescript-eslint/no-explicit-any */ {
        console.error(error);
        return { success: false, error: error.message };
    }
}
