'use server';

import { db as prisma } from '@/lib/db';
import { auth } from '@/lib/auth';

// ─── TYPES ────────────────────────────────────────────────────────────────────

export interface UnifiedInsight {
    platform: string;
    impressions: number;
    clicks: number;
    spend: number;
    conversions: number;
    revenue: number;
    ctr: number;
    cpc: number;
    roas: number;
    cpm: number;
    spendTrend: number[];
    clicksTrend: number[];
}

export interface DashboardMetrics {
    totalSpend: number;
    totalImpressions: number;
    totalClicks: number;
    totalConversions: number;
    totalRevenue: number;
    avgCtr: number;
    avgCpc: number;
    avgRoas: number;
    byPlatform: UnifiedInsight[];
    topCampaigns: Array<{
        id: string;
        name: string;
        platform: string;
        spend: number;
        roas: number;
        status: string;
    }>;
}

// ─── ACTIONS ─────────────────────────────────────────────────────────────────

/**
 * Aggregates ad spend metrics across all platforms for a given date range.
 */
export async function getUnifiedInsights(
    dateRange: 'last_7d' | 'last_30d' | 'last_90d' = 'last_30d'
): Promise<DashboardMetrics> {
    const session = await auth();
    if (!session?.user?.id) throw new Error('Unauthorized');

    const companyUser = await prisma.companyUser.findFirst({
        where: { userId: session.user.id },
        select: { companyId: true },
    });
    if (!companyUser) throw new Error('Company not found');

    const { companyId } = companyUser;
    const days = dateRange === 'last_7d' ? 7 : dateRange === 'last_30d' ? 30 : 90;
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    // Aggregated by platform — use only fields the old client already knows
    const byPlatform = await prisma.adSpend.groupBy({
        by: ['platform'],
        where: { companyId, date: { gte: startDate } },
        _sum: { amount: true, impressions: true, clicks: true, conversions: true },
    });

    // Daily data for sparklines (always last 7 days)
    const trendStart = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const dailyData = await prisma.adSpend.findMany({
        where: { companyId, date: { gte: trendStart } },
        select: { platform: true, date: true, amount: true, clicks: true },
        orderBy: { date: 'asc' },
    });

    const trendByPlatform: Record<string, { spend: number[]; clicks: number[] }> = {};
    dailyData.forEach((row) => {
        if (!trendByPlatform[row.platform]) trendByPlatform[row.platform] = { spend: [], clicks: [] };
        trendByPlatform[row.platform].spend.push(row.amount);
        trendByPlatform[row.platform].clicks.push(row.clicks);
    });

    const platformInsights: UnifiedInsight[] = byPlatform.map((p) => {
        const impressions = p._sum?.impressions ?? 0;
        const clicks = p._sum?.clicks ?? 0;
        const spend = p._sum?.amount ?? 0;
        const conversions = p._sum?.conversions ?? 0;
        const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;
        const cpc = clicks > 0 ? spend / clicks : 0;
        const cpm = impressions > 0 ? (spend / impressions) * 1000 : 0;
        return {
            platform: p.platform,
            impressions,
            clicks,
            spend,
            conversions,
            revenue: 0,
            ctr,
            cpc,
            roas: 0,
            cpm,
            spendTrend: trendByPlatform[p.platform]?.spend ?? [],
            clicksTrend: trendByPlatform[p.platform]?.clicks ?? [],
        };
    });

    const totals = platformInsights.reduce(
        (acc, p) => ({
            totalSpend: acc.totalSpend + p.spend,
            totalImpressions: acc.totalImpressions + p.impressions,
            totalClicks: acc.totalClicks + p.clicks,
            totalConversions: acc.totalConversions + p.conversions,
            totalRevenue: acc.totalRevenue + p.revenue,
        }),
        { totalSpend: 0, totalImpressions: 0, totalClicks: 0, totalConversions: 0, totalRevenue: 0 }
    );

    const avgCtr = totals.totalImpressions > 0 ? (totals.totalClicks / totals.totalImpressions) * 100 : 0;
    const avgCpc = totals.totalClicks > 0 ? totals.totalSpend / totals.totalClicks : 0;
    const avgRoas = totals.totalSpend > 0 ? totals.totalRevenue / totals.totalSpend : 0;

    const topCampaignsData = await prisma.adSpend.groupBy({
        by: ['campaignId'],
        where: { companyId, date: { gte: startDate }, campaignId: { not: null } },
        _sum: { amount: true },
        orderBy: { _sum: { amount: 'desc' } },
        take: 5,
    });

    const campaignIds = topCampaignsData.map((c) => c.campaignId!).filter(Boolean);
    const campaigns = await prisma.campaign.findMany({
        where: { id: { in: campaignIds } },
        select: { id: true, name: true, platform: true, status: true },
    });

    const topCampaigns = topCampaignsData.map((c) => {
        const campaign = campaigns.find((camp) => camp.id === c.campaignId);
        return {
            id: c.campaignId!,
            name: campaign?.name ?? '—',
            platform: campaign?.platform ?? '—',
            spend: c._sum?.amount ?? 0,
            roas: 0,
            status: campaign?.status ?? 'UNKNOWN',
        };
    });

    return { ...totals, avgCtr, avgCpc, avgRoas, byPlatform: platformInsights, topCampaigns };
}

// ─── LEGACY FUNCTIONS (used by marketing/page.tsx) ───────────────────────────

/**
 * @deprecated Use getUnifiedInsights() instead for rich metrics.
 * Kept for backwards compatibility with marketing/page.tsx.
 */
export async function getMarketingKPIs(companyId: string) {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [newLeads, totalLeads, monthlySpend, totalEvents] = await Promise.all([
        prisma.lead.count({ where: { companyId, createdAt: { gte: startOfMonth } } }),
        prisma.lead.count({ where: { companyId } }),
        prisma.adSpend.aggregate({ where: { companyId, date: { gte: startOfMonth } }, _sum: { amount: true } }),
        prisma.analyticsEvent.count({ where: { sessionId: { not: '' } } }),
    ]);

    const spend = monthlySpend._sum.amount ?? 0;
    const cpl = newLeads > 0 ? spend / newLeads : 0;

    return { newLeads, totalLeads, spend, cpl, totalEvents };
}

/**
 * @deprecated Use getUnifiedInsights() byPlatform instead.
 */
export async function getAttributionStats(companyId: string) {
    // Get leads grouped by source, filtering out null sources
    const allLeads = await prisma.lead.findMany({
        where: { companyId, source: { not: '' } },
        select: { source: true },
    });

    const countBySource: Record<string, number> = {};
    allLeads.forEach((l) => {
        const src = l.source ?? 'unknown';
        countBySource[src] = (countBySource[src] ?? 0) + 1;
    });

    return Object.entries(countBySource)
        .map(([source, count]) => ({ source, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);
}

/**
 * @deprecated Use real-time inbox/messaging for live activity.
 */
export async function getRecentActivity(_companyId: string) {
    const events = await prisma.analyticsEvent.findMany({
        orderBy: { createdAt: 'desc' },
        take: 20,
    });

    return events.map((e) => ({
        id: e.id,
        eventType: e.eventType,
        eventName: e.eventName,
        url: e.path,
        visitorId: e.visitorId,
        lead: null as null,
        createdAt: e.createdAt,
    }));
}
