import { NextRequest, NextResponse } from 'next/server';
import { db as prisma } from '@/lib/db';
import crypto from 'crypto';

// ─── SIGNATURE VERIFICATION ───────────────────────────────────────────────────

function verifyMetaSignature(rawBody: string, signature: string | null): boolean {
    const secret = process.env.META_APP_SECRET;
    if (!secret || !signature) return false;

    const expected = 'sha256=' + crypto
        .createHmac('sha256', secret)
        .update(rawBody, 'utf8')
        .digest('hex');

    try {
        return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
    } catch {
        return false;
    }
}

// ─── NORMALIZER ───────────────────────────────────────────────────────────────

interface NormalizedInsight {
    externalCampaignId: string;
    impressions: number;
    clicks: number;
    spend: number;
    conversions: number;
    revenue: number;
    ctr: number;
    cpc: number;
    roas: number;
    cpm: number;
}

function normalizeMetaInsight(entry: Record<string, unknown>): NormalizedInsight {
    const impressions = parseInt((entry.impressions as string) ?? '0');
    const clicks = parseInt((entry.clicks as string) ?? '0');
    const spend = parseFloat((entry.spend as string) ?? '0');
    const actions = (entry.actions as Array<{ action_type: string; value: string }>) ?? [];
    const conversions = actions.find(a => a.action_type === 'lead')?.value ?? '0';
    const purchaseValue = actions.find(a => a.action_type === 'purchase')?.value ?? '0';
    const revenue = parseFloat(purchaseValue);

    return {
        externalCampaignId: entry.campaign_id as string,
        impressions,
        clicks,
        spend,
        conversions: parseInt(conversions),
        revenue,
        ctr: impressions > 0 ? (clicks / impressions) * 100 : 0,
        cpc: clicks > 0 ? spend / clicks : 0,
        roas: spend > 0 ? revenue / spend : 0,
        cpm: impressions > 0 ? (spend / impressions) * 1000 : 0,
    };
}

// ─── UPSERT INTO DB ───────────────────────────────────────────────────────────

async function upsertDailySpend(
    companyId: string,
    campaignId: string | null,
    platform: string,
    date: Date,
    metrics: NormalizedInsight
) {
    const whereClause = campaignId
        ? { date_campaignId_platform: { date, campaignId, platform } }
        : undefined;

    if (!whereClause) return; // Skip if no campaignId — can't upsert without unique key

    await prisma.adSpend.upsert({
        where: whereClause,
        update: {
            amount: metrics.spend,
            impressions: metrics.impressions,
            clicks: metrics.clicks,
            conversions: metrics.conversions,
            revenue: metrics.revenue,
            ctr: metrics.ctr,
            cpc: metrics.cpc,
            roas: metrics.roas,
            cpm: metrics.cpm,
        },
        create: {
            date,
            platform,
            amount: metrics.spend,
            impressions: metrics.impressions,
            clicks: metrics.clicks,
            conversions: metrics.conversions,
            revenue: metrics.revenue,
            ctr: metrics.ctr,
            cpc: metrics.cpc,
            roas: metrics.roas,
            cpm: metrics.cpm,
            campaignId,
            companyId,
        },
    });
}

// ─── ROUTE HANDLER ───────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
    // Meta webhook verification (challenge)
    const mode = req.nextUrl.searchParams.get('hub.mode');
    const token = req.nextUrl.searchParams.get('hub.verify_token');
    const challenge = req.nextUrl.searchParams.get('hub.challenge');

    if (mode === 'subscribe' && token === process.env.META_WEBHOOK_VERIFY_TOKEN) {
        return new NextResponse(challenge, { status: 200 });
    }

    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}

export async function POST(req: NextRequest) {
    const rawBody = await req.text();
    const signature = req.headers.get('x-hub-signature-256');

    if (!verifyMetaSignature(rawBody, signature)) {
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    try {
        const payload = JSON.parse(rawBody) as Record<string, unknown>;

        // Meta sends an array of changes per object
        const entries = (payload.entry as Array<Record<string, unknown>>) ?? [];

        for (const entry of entries) {
            const changes = (entry.changes as Array<Record<string, unknown>>) ?? [];

            for (const change of changes) {
                if (change.field !== 'adaccount') continue;

                const value = change.value as Record<string, unknown>;
                // Meta real-time signals don't send full insights, just flags
                // Full data is fetched when insight webhooks fire for reports
                // Here we store a signal that a sync is needed
                console.log('[Meta Webhook] Change received:', value);
            }
        }

        // Also handle direct insights push (from reporting webhooks / Conversions API)
        if (payload.object === 'insights') {
            const data = (payload.data as Array<Record<string, unknown>>) ?? [];
            const date = new Date((payload.date_start as string) ?? new Date());
            const companyId = req.nextUrl.searchParams.get('companyId') ?? '';

            for (const row of data) {
                const normalized = normalizeMetaInsight(row);
                const campaign = normalized.externalCampaignId
                    ? await prisma.campaign.findFirst({
                        where: { code: normalized.externalCampaignId, companyId },
                        select: { id: true },
                    })
                    : null;

                await upsertDailySpend(
                    companyId,
                    campaign?.id ?? null,
                    'FACEBOOK_ADS',
                    date,
                    normalized
                );
            }
        }

        return NextResponse.json({ received: true });
    } catch (err) {
        console.error('[Meta Webhook] Error:', err);
        return NextResponse.json({ error: 'Processing failed' }, { status: 500 });
    }
}
