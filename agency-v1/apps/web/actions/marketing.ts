'use server';

import { after } from 'next/server';
import { auth } from '@/lib/auth';
import { Campaign } from '@prisma/client';
import { getFacebookCampaigns, getFacebookInsights } from './marketing/facebook-ads';
import { getGoogleCampaigns, getGoogleInsights } from './marketing/google-ads';
import { getTikTokCampaigns, getTikTokInsights } from './marketing/tiktok-ads';
import { getLinkedInCampaigns, getLinkedInInsights } from './marketing/linkedin-ads';

const GATEWAY_URL = process.env.API_GATEWAY_URL || 'http://localhost:8080';

/**
 * Returns aggregated campaigns directly from the local DB, 
 * enriched with live API sync if required.
 */
export async function getCampaignsList(): Promise<Campaign[]> {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");

    const cuRes = await fetch(`${GATEWAY_URL}/api/crm/users/${session.user.id}/company`);
    const cuData = await cuRes.json();
    if (!cuRes.ok || !cuData.data) throw new Error("Company not found");
    const companyId = cuData.data.companyId;

    const res = await fetch(`${GATEWAY_URL}/api/campaigns?companyId=${companyId}`);
    const resData = await res.json();
    if (!res.ok) throw new Error(resData.error || "Failed to fetch campaigns");
    return (resData.data || []) as Campaign[];
}

/**
 * Sync campaigns from connected APIs (Meta, Google) into the DB.
 */
export async function syncLiveCampaigns() {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");

    const cuRes = await fetch(`${GATEWAY_URL}/api/crm/users/${session.user.id}/company`);
    const cuData = await cuRes.json();
    if (!cuRes.ok || !cuData.data) throw new Error("Company not found");
    const companyId = cuData.data.companyId;

    let syncedCount = 0;

    // 1. Sync Meta Ads
    try {
        const fbCampaigns = await getFacebookCampaigns();
        if (fbCampaigns && fbCampaigns.length > 0) {
            const mapped = fbCampaigns.map((fbCamp: any) => ({
                code: fbCamp.id,
                name: fbCamp.name,
                status: fbCamp.status === 'ACTIVE' ? 'ACTIVE' : (fbCamp.status === 'PAUSED' ? 'PAUSED' : 'COMPLETED'),
                budget: fbCamp.daily_budget ? parseFloat(fbCamp.daily_budget) / 100 : null,
            }));
            const syncRes = await fetch(`${GATEWAY_URL}/api/campaigns/sync`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ companyId, platform: 'FACEBOOK_ADS', campaigns: mapped })
            });
            if (syncRes.ok) syncedCount += fbCampaigns.length;
        }
    } catch (error) {
        after(() => console.warn("Skipping Meta Sync or Error Occurred:", error));
    }

    // 2. Sync Google Ads
    try {
        const ggCampaignsResponse = await getGoogleCampaigns();
        const ggCampaigns = ggCampaignsResponse?.results || [];
        if (ggCampaigns.length > 0) {
            const mapped = ggCampaigns.filter((row: any) => row.campaign).map((row: any) => {
                const ggCamp = row.campaign;
                return {
                    code: ggCamp.id.toString(),
                    name: ggCamp.name,
                    status: ggCamp.status === 'ENABLED' ? 'ACTIVE' : 'PAUSED'
                };
            });
            const syncRes = await fetch(`${GATEWAY_URL}/api/campaigns/sync`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ companyId, platform: 'GOOGLE_ADS', campaigns: mapped })
            });
            if (syncRes.ok) syncedCount += mapped.length;
        }
    } catch (error) {
        after(() => console.warn("Skipping Google Sync or Error Occurred:", error));
    }

    // 3. Sync TikTok Ads
    try {
        const tkCampaigns = await getTikTokCampaigns();
        if (tkCampaigns && tkCampaigns.length > 0) {
            const mapped = tkCampaigns.map((tkCamp: any) => ({
                code: tkCamp.campaign_id,
                name: tkCamp.campaign_name,
                status: tkCamp.operation_status === 'ENABLE' ? 'ACTIVE' : 'PAUSED'
            }));
            const syncRes = await fetch(`${GATEWAY_URL}/api/campaigns/sync`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ companyId, platform: 'TIKTOK_ADS', campaigns: mapped })
            });
            if (syncRes.ok) syncedCount += tkCampaigns.length;
        }
    } catch (error) {
        after(() => console.warn("Skipping TikTok Sync or Error Occurred:", error));
    }

    // 4. Sync LinkedIn Ads
    try {
        const liCampaigns = await getLinkedInCampaigns();
        if (liCampaigns && liCampaigns.length > 0) {
            const mapped = liCampaigns.map((liCamp: any) => ({
                code: liCamp.id.toString(),
                name: liCamp.name,
                status: liCamp.status === 'ACTIVE' ? 'ACTIVE' : 'PAUSED'
            }));
            const syncRes = await fetch(`${GATEWAY_URL}/api/campaigns/sync`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ companyId, platform: 'LINKEDIN_ADS', campaigns: mapped })
            });
            if (syncRes.ok) syncedCount += liCampaigns.length;
        }
    } catch (error) {
        after(() => console.warn("Skipping LinkedIn Sync or Error Occurred:", error));
    }

    // 5. Sync Insights/Spend
    try {
        const fbInsights = await getFacebookInsights('last_30d');
        if (fbInsights && fbInsights.length > 0) {
            const campsRes = await fetch(`${GATEWAY_URL}/api/campaigns?companyId=${companyId}`);
            if (campsRes.ok) {
                const campsData = await campsRes.json();
                const campMap = new Map((campsData.data || []).map((c: any) => [c.code, c.id]));
                for (const insight of fbInsights) {
                    const campId = campMap.get(insight.campaign_id);
                    if (campId) {
                        await fetch(`${GATEWAY_URL}/api/campaigns/${campId}/metrics`, {
                            method: 'PATCH',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                spend: parseFloat(insight.spend || "0"),
                                impressions: parseInt(insight.impressions || "0"),
                                clicks: parseInt(insight.clicks || "0"),
                                conversions: parseInt(insight.actions?.find((a: any) => a.action_type === 'offsite_conversion')?.value || "0")
                            })
                        });
                    }
                }
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

    const cuRes = await fetch(`${GATEWAY_URL}/api/crm/users/${session.user.id}/company`);
    const cuData = await cuRes.json();
    if (!cuRes.ok || !cuData.data) throw new Error("Company not found");
    const companyId = cuData.data.companyId;

    const res = await fetch(`${GATEWAY_URL}/api/campaigns/spend-stats?companyId=${companyId}`);
    const resData = await res.json();
    if (!res.ok) throw new Error(resData.error || "Failed to fetch spend stats");

    const stats = resData.data || {};
    const totalSpend = stats.spend || 0;
    const totalConversions = stats.conversions || 0;

    return {
        totalSpend,
        totalImpressions: stats.impressions || 0,
        totalClicks: stats.clicks || 0,
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

    const cuRes = await fetch(`${GATEWAY_URL}/api/crm/users/${session.user.id}/company`);
    const cuData = await cuRes.json();
    if (!cuRes.ok || !cuData.data) return [];
    const companyId = cuData.data.companyId;

    const res = await fetch(`${GATEWAY_URL}/api/campaigns/chart-data?companyId=${companyId}&days=7`);
    const resData = await res.json();
    if (!res.ok) return [];

    const spends = resData.data || [];
    return spends.map((s: any) => ({
        day: new Date(s.date).toLocaleDateString('en-US', { weekday: 'short' }),
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

    const cuRes = await fetch(`${GATEWAY_URL}/api/crm/users/${session.user.id}/company`);
    const cuData = await cuRes.json();
    if (!cuRes.ok || !cuData.data) throw new Error("Company not found");
    const companyId = cuData.data.companyId;

    let campaigns: any[] = [];
    if (campaignId) {
        const res = await fetch(`${GATEWAY_URL}/api/campaigns/${campaignId}/metrics`);
        const resData = await res.json();
        if (res.ok && resData.data) {
            campaigns = [resData.data];
        }
    } else {
        const res = await fetch(`${GATEWAY_URL}/api/campaigns?companyId=${companyId}`);
        const resData = await res.json();
        if (res.ok && resData.data) {
            campaigns = resData.data;
        }
    }

    // Aggregate totals
    const totals = campaigns.reduce((acc, c) => ({
        impressions: acc.impressions + (c.impressions || 0),
        clicks: acc.clicks + (c.clicks || 0),
        conversions: acc.conversions + (c.conversions || 0),
        spend: acc.spend + (c.spend || 0),
    }), { impressions: 0, clicks: 0, conversions: 0, spend: 0 });

    // Break down by platform
    const platformData: Record<string, { impressions: number; clicks: number; conversions: number; spend: number }> = {};
    for (const c of campaigns) {
        if (!c.platform) continue;
        const platforms = c.platform.split(',');
        for (const p of platforms) {
            const key = p.trim();
            if (!platformData[key]) {
                platformData[key] = { impressions: 0, clicks: 0, conversions: 0, spend: 0 };
            }
            // Distribute evenly across platforms if multi-platform
            const factor = 1 / platforms.length;
            platformData[key].impressions += Math.round((c.impressions || 0) * factor);
            platformData[key].clicks += Math.round((c.clicks || 0) * factor);
            platformData[key].conversions += Math.round((c.conversions || 0) * factor);
            platformData[key].spend += (c.spend || 0) * factor;
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
