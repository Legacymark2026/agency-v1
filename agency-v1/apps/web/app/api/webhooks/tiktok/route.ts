import { NextRequest, NextResponse } from 'next/server';
import { db as prisma } from '@/lib/db';
import crypto from 'crypto';

// ─── SIGNATURE VERIFICATION ───────────────────────────────────────────────────

function verifyTikTokSignature(
    rawBody: string,
    timestamp: string | null,
    nonce: string | null,
    signature: string | null
): boolean {
    const secret = process.env.TIKTOK_WEBHOOK_SECRET;
    if (!secret || !signature || !timestamp || !nonce) return false;

    const signString = [process.env.TIKTOK_APP_ID ?? '', timestamp, nonce, rawBody]
        .sort()
        .join('');

    const expected = crypto
        .createHmac('sha256', secret)
        .update(signString, 'utf8')
        .digest('hex');

    try {
        return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
    } catch {
        return false;
    }
}

// ─── NORMALIZER ───────────────────────────────────────────────────────────────

interface TikTokStat {
    campaign_id: string;
    stat_time_day?: string;
    metrics: {
        impressions: string;
        clicks: string;
        spend: string;
        conversions: string;
        conversion_rate: string;
        ctr: string;
        cpc: string;
        cpm: string;
    };
}

function normalizeTikTokStat(stat: TikTokStat) {
    const impressions = parseInt(stat.metrics?.impressions ?? '0');
    const clicks = parseInt(stat.metrics?.clicks ?? '0');
    const spend = parseFloat(stat.metrics?.spend ?? '0');
    const conversions = parseInt(stat.metrics?.conversions ?? '0');
    const ctr = parseFloat(stat.metrics?.ctr ?? '0');
    const cpc = parseFloat(stat.metrics?.cpc ?? '0');
    const cpm = parseFloat(stat.metrics?.cpm ?? '0');

    return {
        externalCampaignId: stat.campaign_id,
        impressions,
        clicks,
        spend,
        conversions,
        revenue: 0, // TikTok doesn't report revenue directly
        ctr,
        cpc,
        roas: 0,
        cpm,
        date: stat.stat_time_day ? new Date(stat.stat_time_day) : new Date(),
    };
}

// ─── ROUTE HANDLER ───────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
    const rawBody = await req.text();
    const timestamp = req.headers.get('x-tiktok-timestamp');
    const nonce = req.headers.get('x-tiktok-nonce');
    const signature = req.headers.get('x-tiktok-signature');

    if (!verifyTikTokSignature(rawBody, timestamp, nonce, signature)) {
        // In dev mode (no secret configured), allow through
        if (process.env.TIKTOK_WEBHOOK_SECRET) {
            return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
        }
    }

    try {
        const payload = JSON.parse(rawBody) as Record<string, unknown>;
        const companyId = req.nextUrl.searchParams.get('companyId') ?? '';

        const data = (payload.data as { list?: TikTokStat[] })?.list ?? [];

        for (const stat of data) {
            const normalized = normalizeTikTokStat(stat);
            const campaign = normalized.externalCampaignId
                ? await prisma.campaign.findFirst({
                    where: { code: normalized.externalCampaignId, companyId },
                    select: { id: true },
                })
                : null;

            if (!campaign?.id) continue;

            await prisma.adSpend.upsert({
                where: {
                    date_campaignId_platform: {
                        date: normalized.date,
                        campaignId: campaign.id,
                        platform: 'TIKTOK_ADS',
                    },
                },
                update: {
                    amount: normalized.spend,
                    impressions: normalized.impressions,
                    clicks: normalized.clicks,
                    conversions: normalized.conversions,
                    revenue: normalized.revenue,
                    ctr: normalized.ctr,
                    cpc: normalized.cpc,
                    roas: normalized.roas,
                    cpm: normalized.cpm,
                },
                create: {
                    date: normalized.date,
                    platform: 'TIKTOK_ADS',
                    amount: normalized.spend,
                    impressions: normalized.impressions,
                    clicks: normalized.clicks,
                    conversions: normalized.conversions,
                    revenue: normalized.revenue,
                    ctr: normalized.ctr,
                    cpc: normalized.cpc,
                    roas: normalized.roas,
                    cpm: normalized.cpm,
                    campaignId: campaign.id,
                    companyId,
                },
            });
        }

        return NextResponse.json({ received: true });
    } catch (err) {
        console.error('[TikTok Webhook] Error:', err);
        return NextResponse.json({ error: 'Processing failed' }, { status: 500 });
    }
}
