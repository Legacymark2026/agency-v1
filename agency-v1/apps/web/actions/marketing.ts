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
// ─── CAMPAIGNS LIST (Modularized & Resilient) ────────────────────────────────
export { getCampaignsList, getCampaignAnalytics } from '@/modules/marketing/actions/campaigns.actions';

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

