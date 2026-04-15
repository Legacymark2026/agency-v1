import { NextRequest, NextResponse } from 'next/server';
import { db as prisma } from '@/lib/db';
import crypto from 'crypto';

// ─── SIGNATURE VERIFICATION ───────────────────────────────────────────────────

function verifyLinkedInSignature(rawBody: string, signature: string | null): boolean {
    const secret = process.env.LINKEDIN_CLIENT_SECRET;
    if (!secret || !signature) return false;

    const expected = crypto
        .createHmac('sha256', secret)
        .update(rawBody, 'utf8')
        .digest('base64');

    try {
        return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
    } catch {
        return false;
    }
}

// ─── NORMALIZER ───────────────────────────────────────────────────────────────

interface LinkedInElement {
    campaignUrn?: string;
    dateRange?: { start: { year: number; month: number; day: number } };
    impressions?: number;
    clicks?: number;
    costInLocalCurrency?: string;
    leadGenerationMailContactInfoShares?: number;
    externalWebsiteConversions?: number;
}

function normalizeLinkedInElement(el: LinkedInElement) {
    const impressions = el.impressions ?? 0;
    const clicks = el.clicks ?? 0;
    const spend = parseFloat(el.costInLocalCurrency ?? '0');
    const conversions =
        (el.leadGenerationMailContactInfoShares ?? 0) +
        (el.externalWebsiteConversions ?? 0);

    // Extract campaignId from URN: `urn:li:sponsoredCampaign:12345` → `12345`
    const campaignUrn = el.campaignUrn ?? '';
    const externalCampaignId = campaignUrn.split(':').pop() ?? '';

    const s = el.dateRange?.start;
    const date = s
        ? new Date(`${s.year}-${String(s.month).padStart(2, '0')}-${String(s.day).padStart(2, '0')}`)
        : new Date();

    return {
        externalCampaignId,
        impressions,
        clicks,
        spend,
        conversions,
        revenue: 0,
        ctr: impressions > 0 ? (clicks / impressions) * 100 : 0,
        cpc: clicks > 0 ? spend / clicks : 0,
        roas: 0,
        cpm: impressions > 0 ? (spend / impressions) * 1000 : 0,
        date,
    };
}

// ─── ROUTE HANDLER ───────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
    const rawBody = await req.text();
    const signature = req.headers.get('x-li-signature');

    if (!verifyLinkedInSignature(rawBody, signature)) {
        if (process.env.LINKEDIN_CLIENT_SECRET) {
            return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
        }
    }

    try {
        const payload = JSON.parse(rawBody) as Record<string, unknown>;
        const companyId = req.nextUrl.searchParams.get('companyId') ?? '';

        const elements = (payload.elements as LinkedInElement[]) ?? [];

        for (const el of elements) {
            const normalized = normalizeLinkedInElement(el);
            if (!normalized.externalCampaignId) continue;

            const campaign = await prisma.campaign.findFirst({
                where: { code: normalized.externalCampaignId, companyId },
                select: { id: true },
            });

            if (!campaign?.id) continue;

            await prisma.adSpend.upsert({
                where: {
                    date_campaignId_platform: {
                        date: normalized.date,
                        campaignId: campaign.id,
                        platform: 'LINKEDIN_ADS',
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
                    platform: 'LINKEDIN_ADS',
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
        console.error('[LinkedIn Webhook] Error:', err);
        return NextResponse.json({ error: 'Processing failed' }, { status: 500 });
    }
}
