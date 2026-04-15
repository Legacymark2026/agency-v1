/* eslint-disable @typescript-eslint/no-explicit-any */
'use server';

/**
 * ab-test-manager.ts
 *
 * A/B Test management for multi-platform asset distribution.
 *
 * NOTE: Uses `(prisma as any)` for models defined in the schema update (ABTest, ABTestVariant)
 * because the Prisma client dll is locked by the running Next.js process and cannot be
 * regenerated until the server is restarted. This will resolve automatically.
 */

import { db as prisma } from '@/lib/db';
import { auth } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

const p = prisma as any;

// ─── TYPES ────────────────────────────────────────────────────────────────────

export interface CreateABTestParams {
    campaignId: string;
    name: string;
    metric: 'CTR' | 'ROAS' | 'CONVERSIONS' | 'IMPRESSIONS';
    assetIds: string[];
    variantNames?: string[];
    weights?: number[];
}

export interface ABTestResult {
    id: string;
    name: string;
    variants: Array<{
        id: string;
        name: string;
        assetId: string | null;
        assetUrl: string | null;
        weight: number;
        impressions: number;
        clicks: number;
        conversions: number;
        spend: number;
        ctr: number;
        roas: number;
    }>;
    winnerVariantId: string | null;
    status: string;
}

// ─── CREATE A/B TEST ──────────────────────────────────────────────────────────

export async function createABTestFromAssets(params: CreateABTestParams) {
    const session = await auth();
    if (!session?.user?.id) throw new Error('Unauthorized');

    const { campaignId, name, metric, assetIds, variantNames, weights } = params;
    if (assetIds.length < 2) throw new Error('A/B Test requires at least 2 assets');

    const evenWeight = Math.floor(100 / assetIds.length);

    const abTest = await p.aBTest.create({
        data: {
            campaignId,
            name,
            metric,
            status: 'DRAFT',
            variants: {
                create: assetIds.map((assetId: string, i: number) => ({
                    assetId,
                    name: variantNames?.[i] ?? `Variante ${String.fromCharCode(65 + i)}`,
                    weight: weights?.[i] ?? evenWeight,
                })),
            },
        },
        include: { variants: true },
    });

    revalidatePath(`/dashboard/admin/marketing/campaigns/${campaignId}`);
    return { success: true, abTestId: abTest.id, variantCount: abTest.variants.length };
}

// ─── DISTRIBUTE ASSETS TO AD SETS ────────────────────────────────────────────

export async function distributeAssetsToAdSets(abTestId: string) {
    const session = await auth();
    if (!session?.user?.id) throw new Error('Unauthorized');

    const abTest = await p.aBTest.findUnique({
        where: { id: abTestId },
        include: {
            variants: { include: { asset: true } },
            campaign: { include: { company: true } },
        },
    });

    if (!abTest) throw new Error('A/B Test not found');

    const results = await Promise.allSettled(
        abTest.variants.map(async (variant: any) => {
            const assetUrl = variant.asset?.url;
            if (!assetUrl) return { variantId: variant.id, status: 'SKIPPED', reason: 'No asset URL' };

            try {
                const platform: string = abTest.campaign.platform;

                if (platform === 'FACEBOOK_ADS') {
                    const mod = await import('@/actions/marketing/facebook-dispatch');
                    if ('createFacebookAdCreative' in mod) {
                        await (mod as any).createFacebookAdCreative({ campaignId: abTest.campaignId, assetUrl, variantName: variant.name, weight: variant.weight });
                    }
                } else if (platform === 'GOOGLE_ADS') {
                    const mod = await import('@/actions/marketing/google-dispatch');
                    if ('createGoogleAdCreative' in mod) {
                        await (mod as any).createGoogleAdCreative({ campaignId: abTest.campaignId, assetUrl, variantName: variant.name });
                    }
                } else if (platform === 'TIKTOK_ADS') {
                    const mod = await import('@/actions/marketing/tiktok-dispatch');
                    if ('createTikTokAdCreative' in mod) {
                        await (mod as any).createTikTokAdCreative({ campaignId: abTest.campaignId, assetUrl, variantName: variant.name });
                    }
                } else if (platform === 'LINKEDIN_ADS') {
                    const mod = await import('@/actions/marketing/linkedin-dispatch');
                    if ('createLinkedInAdCreative' in mod) {
                        await (mod as any).createLinkedInAdCreative({ campaignId: abTest.campaignId, assetUrl, variantName: variant.name });
                    }
                }

                await p.aBTestVariant.update({ where: { id: variant.id }, data: { status: 'ACTIVE' } });
                return { variantId: variant.id, status: 'LAUNCHED', assetUrl };
            } catch (err: unknown) {
                await p.aBTestVariant.update({ where: { id: variant.id }, data: { status: 'ERROR' } }).catch(() => null);
                return { variantId: variant.id, status: 'ERROR', reason: String(err) };
            }
        })
    );

    const allLaunched = results.every((r: any) => r.status === 'fulfilled' && r.value?.status === 'LAUNCHED');
    await p.aBTest.update({
        where: { id: abTestId },
        data: { status: allLaunched ? 'ACTIVE' : 'PARTIAL' },
    });

    return {
        abTestId,
        results: results.map((r: any) => r.status === 'fulfilled' ? r.value : { status: 'ERROR', reason: String(r.reason) }),
    };
}

// ─── GET RESULTS ──────────────────────────────────────────────────────────────

export async function getABTestResults(abTestId: string): Promise<ABTestResult> {
    const session = await auth();
    if (!session?.user?.id) throw new Error('Unauthorized');

    const abTest = await p.aBTest.findUnique({
        where: { id: abTestId },
        include: { variants: { include: { asset: { select: { url: true } } } } },
    });

    if (!abTest) throw new Error('A/B Test not found');

    return {
        id: abTest.id,
        name: abTest.name,
        winnerVariantId: abTest.winnerVariantId ?? null,
        status: abTest.status,
        variants: abTest.variants.map((v: any) => ({
            id: v.id,
            name: v.name,
            assetId: v.assetId,
            assetUrl: v.asset?.url ?? null,
            weight: v.weight,
            impressions: v.impressions ?? 0,
            clicks: v.clicks ?? 0,
            conversions: v.conversions ?? 0,
            spend: v.spend ?? 0,
            ctr: v.impressions > 0 ? (v.clicks / v.impressions) * 100 : 0,
            roas: v.spend > 0 && v.revenue > 0 ? v.revenue / v.spend : 0,
        })),
    };
}

// ─── DECLARE WINNER ───────────────────────────────────────────────────────────

export async function declareWinner(abTestId: string, winnerVariantId: string) {
    const session = await auth();
    if (!session?.user?.id) throw new Error('Unauthorized');

    await prisma.$transaction([
        p.aBTestVariant.updateMany({ where: { abTestId, id: { not: winnerVariantId } }, data: { status: 'PAUSED' } }),
        p.aBTestVariant.update({ where: { id: winnerVariantId }, data: { status: 'WINNER' } }),
        p.aBTest.update({ where: { id: abTestId }, data: { status: 'COMPLETED', winnerVariantId } }),
    ]);

    return { success: true, winnerVariantId };
}
