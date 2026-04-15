'use server';

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { detectLeadSource, parseUTMParams, calculateLeadScore, type UTMParams } from "@/lib/lead-source-detector";

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

        // Automatización CRM: Generar un Deal (Negocio) inicial en el Kanban apenas entra el Lead
        await prisma.deal.create({
            data: {
                title: input.name ? `Lead: ${input.name}` : `Lead: ${input.email}`,
                value: 0,
                stage: "NEW",
                priority: score >= 70 ? "HIGH" : score >= 40 ? "MEDIUM" : "LOW",
                contactName: input.name || "",
                contactEmail: input.email,
                source: sourceResult.source || "Unknown",
                companyId: input.companyId,
            }
        });

        revalidatePath('/dashboard/admin/crm/leads');
        revalidatePath('/dashboard/admin/crm/pipeline');
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
        const lead = await prisma.lead.update({
            where: { id: leadId },
            data: { status }
        });
        revalidatePath('/dashboard/admin/crm/leads');
        return { success: true, data: lead };
    } catch (error: any) /* eslint-disable-line @typescript-eslint/no-explicit-any */ {
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
        await prisma.lead.update({
            where: { id: leadId },
            data: {
                status: 'CONVERTED',
                convertedToDealId: deal.id,
                convertedAt: new Date(),
            }
        });

        revalidatePath('/dashboard/admin/crm/leads');
        revalidatePath('/dashboard/admin/crm/pipeline');
        return { success: true, data: deal };
    } catch (error: any) /* eslint-disable-line @typescript-eslint/no-explicit-any */ {
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
        return { success: false, error: error.message };
    }
}
