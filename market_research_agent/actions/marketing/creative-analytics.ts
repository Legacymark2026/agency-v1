'use server';

import { db as prisma } from '@/lib/db';
import { auth } from '@/lib/auth';

export interface CreativeInsight {
    platform: string;
    topAssetUrl: string | null;
    topAssetRoas: number;
    avgRoas: number;
    avgCtr: number;
    topStylePattern: string;
    totalAssets: number;
    winRate: number;
}

export async function getCreativeInsights(): Promise<CreativeInsight[]> {
    const session = await auth();
    if (!session?.user?.id) throw new Error('Unauthorized');

    const companyUser = await prisma.companyUser.findFirst({
        where: { userId: session.user.id },
        select: { companyId: true },
    });
    if (!companyUser) throw new Error('Company not found');

    const { companyId } = companyUser;

    // Get all campaigns with their ad spend metrics
    const campaigns = await prisma.campaign.findMany({
        where: { companyId },
        select: {
            id: true,
            platform: true,
            status: true,
            assets: { select: { id: true, url: true } },
            adSpends: { select: { amount: true, clicks: true, impressions: true, conversions: true } },
        },
    });

    // Group by platform and calculate metrics
    const byPlatform: Record<string, {
        spends: number[];
        clicks: number[];
        impressions: number[];
        assets: Array<{ url: string; roas: number; prompt?: string }>;
    }> = {};

    campaigns.forEach((c) => {
        if (!byPlatform[c.platform]) {
            byPlatform[c.platform] = { spends: [], clicks: [], impressions: [], assets: [] };
        }
        const totalSpend = c.adSpends.reduce((a, b) => a + b.amount, 0);
        const totalClicks = c.adSpends.reduce((a, b) => a + b.clicks, 0);
        const totalImpressions = c.adSpends.reduce((a, b) => a + b.impressions, 0);
        const totalConversions = c.adSpends.reduce((a, b) => a + b.conversions, 0);
        const revenue = totalConversions * 50; // estimate: $50 avg order value

        byPlatform[c.platform].spends.push(totalSpend);
        byPlatform[c.platform].clicks.push(totalClicks);
        byPlatform[c.platform].impressions.push(totalImpressions);

        c.assets.forEach((asset) => {
            const meta = (asset as any).metadata as Record<string, unknown> | null;
            byPlatform[c.platform].assets.push({
                url: asset.url,
                roas: totalSpend > 0 ? revenue / totalSpend : 0,
                prompt: meta?.originalPrompt as string | undefined,
            });
        });
    });

    return Object.entries(byPlatform).map(([platform, data]) => {
        const avgSpend = data.spends.reduce((a, b) => a + b, 0) / (data.spends.length || 1);
        const avgClicks = data.clicks.reduce((a, b) => a + b, 0) / (data.clicks.length || 1);
        const avgImpressions = data.impressions.reduce((a, b) => a + b, 0) / (data.impressions.length || 1);
        const avgCtr = avgImpressions > 0 ? (avgClicks / avgImpressions) * 100 : 0;

        const sortedAssets = [...data.assets].sort((a, b) => b.roas - a.roas);
        const topAsset = sortedAssets[0] ?? null;

        // Extract style pattern from prompts
        const prompts = data.assets.map((a) => a.prompt ?? '').filter(Boolean);
        const keywords: Record<string, number> = {};
        prompts.forEach((p) => {
            ['dark', 'light', 'minimalist', 'bold', 'professional', 'lifestyle', 'product', 'person', 'outdoor', 'indoor'].forEach((kw) => {
                if (p.toLowerCase().includes(kw)) keywords[kw] = (keywords[kw] ?? 0) + 1;
            });
        });
        const topStyle = Object.entries(keywords).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'varied';

        const winningAssets = data.assets.filter((a) => a.roas > 1);

        return {
            platform,
            topAssetUrl: topAsset?.url ?? null,
            topAssetRoas: topAsset?.roas ?? 0,
            avgRoas: data.assets.reduce((a, b) => a + b.roas, 0) / (data.assets.length || 1),
            avgCtr,
            topStylePattern: topStyle,
            totalAssets: data.assets.length,
            winRate: data.assets.length > 0 ? (winningAssets.length / data.assets.length) * 100 : 0,
        };
    });
}
