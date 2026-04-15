'use server';

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { detectLeadSource, parseUTMParams, calculateLeadScore, type UTMParams } from "@/lib/lead-source-detector";
import { sendMetaCapiEvent } from "@/lib/meta-capi";
import { sendGa4Event } from "@/lib/ga4-mp";
import { sendTiktokCapiEvent } from "@/lib/tiktok-capi";
import { sendLinkedinCapiEvent } from "@/lib/linkedin-capi";
import { auth } from "@/lib/auth";
import { Permission, ROLE_PERMISSIONS, UserRole } from "@/types/auth";
import { dispatchConversion } from "@/lib/services/conversions/dispatcher";

const CRM_VBO_STAGES: Record<string, { event: string, value: number }> = {
  NEW: { event: 'Lead', value: 0 },
  CONTACTED: { event: 'StartTrial', value: 10 },
  QUALIFIED: { event: 'QualifiedLead', value: 50 }, // More descriptive for algorithms
  PROPOSAL: { event: 'Contact', value: 150 },
  NEGOTIATION: { event: 'CustomizeProduct', value: 300 },
  WON: { event: 'Purchase', value: 0 }, // Value overridden by Deal value
  LOST: { event: 'DisqualifiedLead', value: 0 },
  DISQUALIFIED: { event: 'DisqualifiedLead', value: 0 }
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
    campaignCode?: string; // Will be matched to a Campaign

    // Meta
    formId?: string;
    formData?: Record<string, any>;
    ipAddress?: string;
    userAgent?: string;
    tags?: string[];
}

/**
 * Create a new lead with automatic source detection
 */
export async function createLead(input: CreateLeadInput) {
    try {
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
            const campaign = await prisma.campaign.findFirst({
                where: {
                    OR: [
                        { code: campaignCode },
                        { code: { contains: campaignCode, mode: 'insensitive' } }
                    ],
                    companyId: input.companyId
                }
            });
            if (campaign) {
                campaignId = campaign.id;
                // Increment campaign conversions
                await prisma.campaign.update({
                    where: { id: campaign.id },
                    data: { conversions: { increment: 1 } }
                });
            }
        }

        // Calculate lead score
        const score = calculateLeadScore({
            email: input.email,
            name: input.name,
            phone: input.phone,
            company: input.company,
            jobTitle: input.jobTitle,
            source: sourceResult.source,
        });

        // Create the lead
        const lead = await prisma.lead.create({
            data: {
                email: input.email,
                name: input.name,
                phone: input.phone,
                company: input.company,
                jobTitle: input.jobTitle,
                message: input.message,

                // Source tracking
                source: sourceResult.source,
                medium: sourceResult.medium,
                utmSource: sourceResult.utmSource || input.utmSource,
                utmMedium: sourceResult.utmMedium || input.utmMedium,
                utmCampaign: sourceResult.utmCampaign || input.utmCampaign,
                utmTerm: sourceResult.utmTerm || input.utmTerm,
                utmContent: sourceResult.utmContent || input.utmContent,
                referer: input.referer,
                landingPage: input.landingPage,

                // Campaign
                campaignId,

                // Meta
                ipAddress: input.ipAddress,
                userAgent: input.userAgent,
                formId: input.formId,
                formData: input.formData,
                tags: input.tags || [],
                score,

                // Company
                companyId: input.companyId,
            },
            include: {
                campaign: true,
            }
        });

        // Trigger Meta Conversions API Event
        sendMetaCapiEvent(input.companyId, {
            eventName: "Lead",
            actionSource: "website",
            eventSourceUrl: input.landingPage || input.referer || undefined,
            userData: {
                em: input.email,
                ph: input.phone || undefined,
                fn: input.name ? input.name.split(' ')[0] : undefined,
                ln: input.name ? input.name.split(' ').slice(1).join(' ') : undefined,
                client_ip_address: input.ipAddress,
                client_user_agent: input.userAgent,
            },
            customData: {
                content_name: "CRM Lead Captured",
                status: "NEW",
                currency: "COP",
                value: 0.00
            }
        }).catch(err => console.error("[LeadsAction] Failed to send CAPI event:", err));

        // Trigger Google Analytics 4 Measurement Protocol Event
        sendGa4Event(input.companyId, {
            eventName: "generate_lead",
            userData: {
                email: input.email,
                phone: input.phone || undefined,
                firstName: input.name ? input.name.split(' ')[0] : undefined,
                lastName: input.name ? input.name.split(' ').slice(1).join(' ') : undefined,
            },
            eventParams: {
                lead_source: sourceResult.source,
                lead_score: score,
                lead_status: "NEW"
            }
        }).catch(err => console.error("[LeadsAction] Failed to send GA4-MP event:", err));

        // Trigger TikTok Events API
        sendTiktokCapiEvent(input.companyId, {
            eventName: "SubmitForm",
            eventSourceUrl: input.landingPage || input.referer || undefined,
            userData: {
                email: input.email,
                phone: input.phone || undefined,
                clientIpAddress: input.ipAddress,
                clientUserAgent: input.userAgent,
            },
            customData: {
                contentName: "CRM Lead Captured",
                value: 0,
                currency: "COP"
            }
        }).catch(err => console.error("[LeadsAction] Failed to send TikTok event:", err));

        // Trigger LinkedIn Conversions API
        sendLinkedinCapiEvent(input.companyId, {
            conversionInfo: {
                currencyCode: "COP",
                amount: 0
            },
            userData: {
                email: input.email,
                firstName: input.name ? input.name.split(' ')[0] : undefined,
                lastName: input.name ? input.name.split(' ').slice(1).join(' ') : undefined,
            }
        }).catch(err => console.error("[LeadsAction] Failed to send LinkedIn event:", err));

        revalidatePath('/dashboard/admin/crm/leads');
        return { success: true, data: lead };
    } catch (error: any) /* eslint-disable-line @typescript-eslint/no-explicit-any */ {
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
        const leads = await prisma.lead.findMany({
            where: {
                companyId,
                ...(options?.source && { source: options.source }),
                ...(options?.status && { status: options.status }),
                ...(options?.campaignId && { campaignId: options.campaignId }),
            },
            include: {
                campaign: {
                    select: { id: true, name: true, code: true, platform: true }
                }
            },
            orderBy: { createdAt: 'desc' },
            take: options?.limit,
        });
        return { success: true, data: leads };
    } catch (error: any) /* eslint-disable-line @typescript-eslint/no-explicit-any */ {
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

        const lead = await prisma.lead.findUnique({ where: { id: leadId } });
        if (!lead) return { success: false, error: "Lead not found" };

        let dealId = lead.convertedToDealId;

        // Auto-create or Auto-sync Deal if status implies pipeline progress
        const dealStages = ['NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION', 'WON', 'LOST'];

        if (dealStages.includes(status) && !dealId) {
            // Auto-create deal to maintain complete sync with Sales Channel
            const deal = await prisma.deal.create({
                data: {
                    title: `Deal - ${lead.name || lead.email}`,
                    value: 0,
                    stage: status,
                    contactName: lead.name,
                    contactEmail: lead.email,
                    source: lead.source,
                    priority: lead.score >= 70 ? 'HIGH' : lead.score >= 40 ? 'MEDIUM' : 'LOW',
                    companyId: lead.companyId,
                }
            });
            dealId = deal.id;
        } else if (dealId && dealStages.includes(status)) {
            // Sync status to the existing deal
            await prisma.deal.update({
                where: { id: dealId },
                data: { stage: status }
            });
        }

        const dataToUpdate: any = { status };
        if (dealId && !lead.convertedToDealId) {
            dataToUpdate.convertedToDealId = dealId;
            dataToUpdate.convertedAt = new Date();
        }

        const updatedLead = await prisma.lead.update({
            where: { id: leadId },
            data: dataToUpdate
        });

        // Trigger S2S Conversions if status maps to VBO Stage
        const vboStage = CRM_VBO_STAGES[status];
        if (vboStage) {
            let eventValue = vboStage.value;
            
            // If it's closed WON and there's a deal, try to get actual Deal value for exact ROAS
            if (status === 'WON' && dealId) {
                const deal = await prisma.deal.findUnique({ where: { id: dealId } });
                if (deal) eventValue = deal.value;
            }

            // Do not block the UI response
            dispatchConversion({
                leadId: lead.id,
                eventName: vboStage.event,
                value: eventValue,
                currency: "USD",
                timestamp: Date.now(),
                userData: {
                    email: lead.email,
                    phone: lead.phone,
                    firstName: lead.name ? lead.name.split(' ')[0] : undefined,
                    lastName: lead.name ? lead.name.split(' ').slice(1).join(' ') : undefined,
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
        }

        revalidatePath('/dashboard/admin/crm/leads');
        revalidatePath('/dashboard/admin/crm/pipeline');
        return { success: true, data: updatedLead };
    } catch (error: any) /* eslint-disable-line @typescript-eslint/no-explicit-any */ {
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

        const lead = await prisma.lead.update({
            where: { id: leadId },
            data: { score }
        });
        revalidatePath('/dashboard/admin/crm/leads');
        revalidatePath(`/dashboard/admin/crm/leads/${leadId}`);
        return { success: true, data: lead };
    } catch (error: any) /* eslint-disable-line @typescript-eslint/no-explicit-any */ {
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

        const lead = await prisma.lead.findUnique({ where: { id: leadId } });
        if (!lead) {
            return { success: false, error: "Lead not found" };
        }

        // Create deal from lead
        const deal = await prisma.deal.create({
            data: {
                title: dealData.title,
                value: dealData.value,
                stage: dealData.stage || 'NEW',
                contactName: lead.name,
                contactEmail: lead.email,
                source: lead.source,
                priority: lead.score >= 70 ? 'HIGH' : lead.score >= 40 ? 'MEDIUM' : 'LOW',
                companyId: lead.companyId,
            }
        });

        // Update lead as converted
        const updatedLead = await prisma.lead.update({
            where: { id: leadId },
            data: {
                status: 'CONVERTED',
                convertedToDealId: deal.id,
                convertedAt: new Date(),
            }
        });

        // Trigger VBO S2S Conversion for deal creation
        dispatchConversion({
            leadId: lead.id,
            eventName: 'Purchase', // Using Purchase or Lead as appropriate
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
        return { success: true, data: deal };
    } catch (error: any) /* eslint-disable-line @typescript-eslint/no-explicit-any */ {
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

        const lead = await prisma.lead.findUnique({
            where: { id: leadId },
            select: { email: true, companyId: true, name: true }
        });

        if (lead) {
            // ELIMINACIÓN EN CASCADA: Borrar Deals asociados a este correo en esta empresa
            await prisma.deal.deleteMany({
                where: {
                    companyId: lead.companyId,
                    contactEmail: lead.email,
                }
            });
            revalidatePath('/dashboard/admin/crm/pipeline');
            revalidatePath('/dashboard/admin/crm');
        }

        await prisma.lead.delete({
            where: { id: leadId }
        });

        revalidatePath('/dashboard/admin/crm/leads');
        return { success: true };
    } catch (error: any) /* eslint-disable-line @typescript-eslint/no-explicit-any */ {
        console.error(error);
        return { success: false, error: error.message };
    }
}

/**
 * Get lead analytics by source
 */
export async function getLeadAnalyticsBySource(companyId: string) {
    try {
        const analytics = await prisma.lead.groupBy({
            by: ['source'],
            where: { companyId },
            _count: { id: true },
            _avg: { score: true },
        });

        const result = analytics.map(a => ({
            source: a.source,
            count: a._count.id,
            avgScore: Math.round(a._avg.score || 0),
        }));

        return { success: true, data: result };
    } catch (error: any) /* eslint-disable-line @typescript-eslint/no-explicit-any */ {
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
        const campaign = await prisma.campaign.create({
            data: {
                name: input.name,
                code: input.code.toUpperCase(),
                platform: input.platform,
                description: input.description,
                budget: input.budget,
                startDate: input.startDate,
                endDate: input.endDate,
                companyId: input.companyId,
            }
        });
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
        const campaigns = await prisma.campaign.findMany({
            where: {
                companyId,
                ...(status && { status }),
            },
            include: {
                _count: { select: { leads: true } }
            },
            orderBy: { createdAt: 'desc' },
        });
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
        const campaign = await prisma.campaign.update({
            where: { id: campaignId },
            data
        });
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
        await prisma.campaign.delete({ where: { id: campaignId } });
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
        const campaign = await prisma.campaign.findUnique({
            where: { id: campaignId },
            include: {
                leads: {
                    select: { id: true, status: true, score: true, createdAt: true }
                }
            }
        });

        if (!campaign) {
            return { success: false, error: "Campaign not found" };
        }

        const metrics = {
            ...campaign,
            leadCount: campaign.leads.length,
            convertedLeads: campaign.leads.filter(l => l.status === 'CONVERTED').length,
            avgLeadScore: campaign.leads.length > 0
                ? Math.round(campaign.leads.reduce((sum, l) => sum + l.score, 0) / campaign.leads.length)
                : 0,
            costPerLead: campaign.spend > 0 && campaign.leads.length > 0
                ? (campaign.spend / campaign.leads.length).toFixed(2)
                : null,
        };

        return { success: true, data: metrics };
    } catch (error: any) /* eslint-disable-line @typescript-eslint/no-explicit-any */ {
        console.error(error);
        return { success: false, error: error.message };
    }
}
