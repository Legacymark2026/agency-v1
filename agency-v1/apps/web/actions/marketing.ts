'use server';

import { after } from 'next/server';

import { db as prisma } from '@/lib/db';
import { auth } from '@/lib/auth';
import { getFacebookCampaigns, getFacebookInsights } from './marketing/facebook-ads';
import { getGoogleCampaigns, getGoogleInsights } from './marketing/google-ads';
import { getTikTokCampaigns, getTikTokInsights } from './marketing/tiktok-ads';
import { getLinkedInCampaigns, getLinkedInInsights } from './marketing/linkedin-ads';

/**
 * Returns aggregated campaigns directly from the local DB, 
 * enriched with live API sync if required.
 */
export async function getCampaignsList() {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");

    const companyUser = await prisma.companyUser.findFirst({
        where: { userId: session.user.id },
        select: { companyId: true }
    });

    if (!companyUser) throw new Error("Company not found");

    const campaigns = await prisma.campaign.findMany({
        where: { companyId: companyUser.companyId },
        orderBy: { createdAt: 'desc' }
    });

    return campaigns;
}

/**
 * Sync campaigns from connected APIs (Meta, Google) into the DB.
 */
export async function syncLiveCampaigns() {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");

    const companyUser = await prisma.companyUser.findFirst({
        where: { userId: session.user.id },
        select: { companyId: true }
    });
    if (!companyUser) throw new Error("Company not found");

    const companyId = companyUser.companyId;
    let syncedCount = 0;

    // 1. Sync Meta Ads
    try {
        const fbCampaigns = await getFacebookCampaigns();
        if (fbCampaigns && fbCampaigns.length > 0) {
            for (const fbCamp of fbCampaigns) {
                // Upsert into DB
                await prisma.campaign.upsert({
                    where: { code: fbCamp.id }, // Using platform ID as unique code
                    update: {
                        name: fbCamp.name,
                        status: fbCamp.status === 'ACTIVE' ? 'ACTIVE' : (fbCamp.status === 'PAUSED' ? 'PAUSED' : 'COMPLETED'),
                        budget: fbCamp.daily_budget ? parseFloat(fbCamp.daily_budget) / 100 : null, // Meta budget comes in cents
                    },
                    create: {
                        name: fbCamp.name,
                        code: fbCamp.id,
                        platform: 'FACEBOOK_ADS',
                        status: fbCamp.status === 'ACTIVE' ? 'ACTIVE' : 'PAUSED',
                        budget: fbCamp.daily_budget ? parseFloat(fbCamp.daily_budget) / 100 : null,
                        companyId: companyId
                    }
                });
                syncedCount++;
            }
        }
    } catch (error) {
        after(() => console.warn("Skipping Meta Sync or Error Occurred:", error));
    }

    // 2. Sync Google Ads (If implemented completely)
    try {
        const ggCampaignsResponse = await getGoogleCampaigns();
        // Assuming response structure has a data array of items
        const ggCampaigns = ggCampaignsResponse?.results || [];
        for (const row of ggCampaigns) {
            if (!row.campaign) continue;
            const ggCamp = row.campaign;

            await prisma.campaign.upsert({
                where: { code: ggCamp.id.toString() },
                update: {
                    name: ggCamp.name,
                    status: ggCamp.status === 'ENABLED' ? 'ACTIVE' : 'PAUSED'
                },
                create: {
                    name: ggCamp.name,
                    code: ggCamp.id.toString(),
                    platform: 'GOOGLE_ADS',
                    status: ggCamp.status === 'ENABLED' ? 'ACTIVE' : 'PAUSED',
                    companyId: companyId
                }
            });
            syncedCount++;
        }
    } catch (error) {
        after(() => console.warn("Skipping Google Sync or Error Occurred:", error));
    }

    // 3. Sync TikTok Ads
    try {
        const tkCampaigns = await getTikTokCampaigns();
        if (tkCampaigns && tkCampaigns.length > 0) {
            for (const tkCamp of tkCampaigns) {
                await prisma.campaign.upsert({
                    where: { code: tkCamp.campaign_id },
                    update: {
                        name: tkCamp.campaign_name,
                        status: tkCamp.operation_status === 'ENABLE' ? 'ACTIVE' : 'PAUSED'
                    },
                    create: {
                        name: tkCamp.campaign_name,
                        code: tkCamp.campaign_id,
                        platform: 'TIKTOK_ADS',
                        status: tkCamp.operation_status === 'ENABLE' ? 'ACTIVE' : 'PAUSED',
                        companyId: companyId
                    }
                });
                syncedCount++;
            }
        }
    } catch (error) {
        after(() => console.warn("Skipping TikTok Sync or Error Occurred:", error));
    }

    // 4. Sync LinkedIn Ads
    try {
        const liCampaigns = await getLinkedInCampaigns();
        if (liCampaigns && liCampaigns.length > 0) {
            for (const liCamp of liCampaigns) {
                const idStr = liCamp.id.toString();
                await prisma.campaign.upsert({
                    where: { code: idStr },
                    update: {
                        name: liCamp.name,
                        status: liCamp.status === 'ACTIVE' ? 'ACTIVE' : 'PAUSED'
                    },
                    create: {
                        name: liCamp.name,
                        code: idStr,
                        platform: 'LINKEDIN_ADS',
                        status: liCamp.status === 'ACTIVE' ? 'ACTIVE' : 'PAUSED',
                        companyId: companyId
                    }
                });
                syncedCount++;
            }
        }
    } catch (error) {
        after(() => console.warn("Skipping LinkedIn Sync or Error Occurred:", error));
    }

    // 5. Sync Insights/Spend
    try {
        const fbInsights = await getFacebookInsights('last_30d');
        if (fbInsights && fbInsights.length > 0) {
            for (const insight of fbInsights) {
                await prisma.campaign.update({
                    where: { code: insight.campaign_id },
                    data: {
                        spend: parseFloat(insight.spend || "0"),
                        impressions: parseInt(insight.impressions || "0"),
                        clicks: parseInt(insight.clicks || "0"),
                        conversions: parseInt(insight.actions?.find((a: any) => a.action_type === 'offsite_conversion')?.value || "0")
                    }
                });
            }
        }
    } catch (error) {
        after(() => console.warn("Failed to sync insights:", error));
    }

    return { success: true, syncedCount };
}

/**
 * Gets aggregated high-level spend metrics for the dashboard.
 */
export async function getAggregatedSpend() {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");

    // In a real scenario, we might sum the `campaign` table or `ad_spend` table
    const companyUser = await prisma.companyUser.findFirst({
        where: { userId: session.user.id },
        select: { companyId: true }
    });

    const stats = await prisma.campaign.aggregate({
        where: { companyId: companyUser?.companyId },
        _sum: {
            spend: true,
            impressions: true,
            clicks: true,
            conversions: true
        }
    });

    const totalSpend = stats._sum.spend || 0;
    const totalConversions = stats._sum.conversions || 0;

    return {
        totalSpend,
        totalImpressions: stats._sum.impressions || 0,
        totalClicks: stats._sum.clicks || 0,
        totalConversions,
        cpa: totalConversions > 0 ? (totalSpend / totalConversions) : 0
    };
}

/**
 * Gets historical performance chart data for the last 7 days.
 */
export async function getCampaignChartData() {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");

    const companyUser = await prisma.companyUser.findFirst({
        where: { userId: session.user.id },
        select: { companyId: true }
    });
    if (!companyUser) return [];

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const spends = await prisma.adSpend.groupBy({
        by: ['date'],
        where: {
            companyId: companyUser.companyId,
            date: { gte: sevenDaysAgo }
        },
        _sum: {
            amount: true,
            conversions: true
        },
        orderBy: {
            date: 'asc'
        }
    });

    return spends.map(s => ({
        day: s.date.toLocaleDateString('en-US', { weekday: 'short' }),
        spend: s._sum.amount || 0,
        conversions: s._sum.conversions || 0,
    }));
}

/**
 * Gets real analytics for a specific campaign or aggregated for all campaigns.
 * Reads from DB (synced via syncLiveCampaigns). Falls back to platform API data if available.
 */
export async function getCampaignAnalytics(campaignId?: string) {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");

    const companyUser = await prisma.companyUser.findFirst({
        where: { userId: session.user.id },
        select: { companyId: true }
    });
    if (!companyUser) throw new Error("Company not found");

    const where: any = { companyId: companyUser.companyId };
    if (campaignId) where.id = campaignId;

    const campaigns = await prisma.campaign.findMany({
        where,
        select: {
            id: true,
            platform: true,
            impressions: true,
            clicks: true,
            conversions: true,
            spend: true,
            budget: true,
            status: true,
        }
    });

    // Aggregate totals
    const totals = campaigns.reduce((acc, c) => ({
        impressions: acc.impressions + c.impressions,
        clicks: acc.clicks + c.clicks,
        conversions: acc.conversions + c.conversions,
        spend: acc.spend + c.spend,
    }), { impressions: 0, clicks: 0, conversions: 0, spend: 0 });

    // Break down by platform
    const platformData: Record<string, { impressions: number; clicks: number; conversions: number; spend: number }> = {};
    for (const c of campaigns) {
        const platforms = c.platform.split(',');
        for (const p of platforms) {
            const key = p.trim();
            if (!platformData[key]) {
                platformData[key] = { impressions: 0, clicks: 0, conversions: 0, spend: 0 };
            }
            // Distribute evenly across platforms if multi-platform
            const factor = 1 / platforms.length;
            platformData[key].impressions += Math.round(c.impressions * factor);
            platformData[key].clicks += Math.round(c.clicks * factor);
            platformData[key].conversions += Math.round(c.conversions * factor);
            platformData[key].spend += c.spend * factor;
        }
    }

    return {
        impressions: totals.impressions,
        clicks: totals.clicks,
        conversions: totals.conversions,
        spend: totals.spend,
        cpc: totals.clicks > 0 ? totals.spend / totals.clicks : 0,
        cpm: totals.impressions > 0 ? (totals.spend / totals.impressions) * 1000 : 0,
        roas: totals.spend > 0 ? (totals.conversions * 50) / totals.spend : 0, // Assume $50 avg conversion value
        conversionRate: totals.clicks > 0 ? (totals.conversions / totals.clicks) * 100 : 0,
        platformData,
        campaignCount: campaigns.length,
    };
}
