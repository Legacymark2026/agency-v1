import { NextRequest, NextResponse } from 'next/server';
import { db as prisma } from '@/lib/db';
import crypto from 'crypto';

// ─── SIGNATURE VERIFICATION ───────────────────────────────────────────────────

async function verifyGoogleSignature(req: NextRequest, rawBody: string): Promise<boolean> {
    // Google Pub/Sub pushes JWT in Authorization header
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) return false;

    // For production: validate JWT against Google's public keys
    // For now, validate a shared secret ENV variable
    const token = authHeader.replace('Bearer ', '');
    const expected = process.env.GOOGLE_WEBHOOK_SECRET;

    if (!expected) return true; // Skip verification if not configured (dev mode)

    try {
        return crypto.timingSafeEqual(Buffer.from(token), Buffer.from(expected));
    } catch {
        return false;
    }
}

// ─── NORMALIZER ───────────────────────────────────────────────────────────────

interface GoogleRow {
    campaign: { id: { value: string }; name: string };
    metrics: {
        impressions: string;
        clicks: string;
        cost_micros: string;
        conversions: string;
        conversion_value: string;
    };
    segments: { date: string };
}

function normalizeGoogleRow(row: GoogleRow) {
    const impressions = parseInt(row.metrics?.impressions ?? '0');
    const clicks = parseInt(row.metrics?.clicks ?? '0');
    const costMicros = parseInt(row.metrics?.cost_micros ?? '0');
    const spend = costMicros / 1_000_000; // micros → USD
    const conversions = parseFloat(row.metrics?.conversions ?? '0');
    const revenue = parseFloat(row.metrics?.conversion_value ?? '0');

    return {
        externalCampaignId: row.campaign?.id?.value ?? '',
        impressions,
        clicks,
        spend,
        conversions: Math.round(conversions),
        revenue,
        ctr: impressions > 0 ? (clicks / impressions) * 100 : 0,
        cpc: clicks > 0 ? spend / clicks : 0,
        roas: spend > 0 ? revenue / spend : 0,
        cpm: impressions > 0 ? (spend / impressions) * 1000 : 0,
        date: row.segments?.date ? new Date(row.segments.date) : new Date(),
    };
}

// ─── ROUTE HANDLER ───────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
    const rawBody = await req.text();

    const isValid = await verifyGoogleSignature(req, rawBody);
    if (!isValid) {
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    try {
        const payload = JSON.parse(rawBody) as Record<string, unknown>;
        const companyId = req.nextUrl.searchParams.get('companyId') ?? '';

        // Google Ads → Pub/Sub → webhook structure
        // The message data is base64-encoded JSON
        const message = payload.message as { data: string } | undefined;
        if (message?.data) {
            const decodedData = JSON.parse(
                Buffer.from(message.data, 'base64').toString('utf-8')
            ) as { rows?: GoogleRow[] };

            const rows = decodedData.rows ?? [];

            for (const row of rows) {
                const normalized = normalizeGoogleRow(row);
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
                            platform: 'GOOGLE_ADS',
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
                        platform: 'GOOGLE_ADS',
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
        }

        return NextResponse.json({ received: true });
    } catch (err) {
        console.error('[Google Webhook] Error:', err);
        return NextResponse.json({ error: 'Processing failed' }, { status: 500 });
    }
}
