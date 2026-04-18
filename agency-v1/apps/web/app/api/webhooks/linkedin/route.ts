import { NextRequest, NextResponse } from 'next/server';
import { db as prisma } from '@/lib/db';
import crypto from 'crypto';

async function getLinkedInConfig(companyId: string) {
    if (!companyId) return null;
    try {
        const config = await prisma.integrationConfig.findUnique({
            where: { companyId_provider: { companyId, provider: 'linkedin-webhook' } },
        });
        return config?.config as Record<string, string> | null;
    } catch {
        return null;
    }
}

async function verifyLinkedInSignature(
    rawBody: string, 
    signature: string | null,
    companyId?: string
): Promise<boolean> {
    if (!signature) return false;

    // Try DB config first
    let secret: string | undefined;
    
    if (companyId) {
        const dbConfig = await getLinkedInConfig(companyId);
        if (dbConfig) {
            secret = dbConfig.linkedinWebhookSecret || dbConfig.linkedinClientSecret;
        }
    }
    
    // Fall back to env
    secret = secret || process.env.LINKEDIN_WEBHOOK_SECRET || process.env.LINKEDIN_CLIENT_SECRET;

    if (!secret) return false;

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

// ─── IDEMPOTENCY CHECK ───────────────────────────────────────────────────────────

async function isEventProcessed(eventId: string): Promise<boolean> {
    const existing = await prisma.webhookEvent.findUnique({
        where: { externalId: eventId },
    });
    return !!existing;
}

async function markEventProcessed(eventId: string, eventType: string) {
    await prisma.webhookEvent.create({
        data: {
            externalId: eventId,
            eventType,
            platform: 'LINKEDIN',
            processedAt: new Date(),
        },
    });
}

// ─── LINKEDIN EVENT TYPES ───────────────────────────────────────────────────────

type LinkedInEventType = 
    | 'ORGANIZATION_STATUS_CHANGE'
    | 'AD_CREATIVE_STATUS_CHANGE'
    | 'MEMBER_FOLLOW_ACTION'
    | 'INSIGHTS';

interface LinkedInStatusEvent {
    eventType: LinkedInEventType;
    eventId?: string;
    organizationUrn?: string;
    organizationStatus?: string;
    campaignUrn?: string;
    campaignStatus?: string;
    memberUrn?: string;
    action?: 'FOLLOW' | 'UNFOLLOW';
    timestamp?: number;
    [key: string]: unknown;
}

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

// ─── ORGANIZATION STATUS HANDLER ───────────────────────────────────────────────

async function handleOrganizationStatusChange(
    companyId: string,
    event: LinkedInStatusEvent
) {
    const orgUrn = event.organizationUrn ?? '';
    const status = event.organizationStatus ?? 'UNKNOWN';
    const orgId = orgUrn.split(':').pop() ?? orgUrn;

    console.log(`[LinkedIn Webhook] Organization status change: ${orgId} → ${status}`);

    await prisma.notification.create({
        data: {
            type: 'ORGANIZATION_STATUS',
            title: `LinkedIn Organization: ${status}`,
            message: `Organization ${orgId} changed to status: ${status}`,
            companyId,
            metadata: { severity: status === 'DELETED' || status === 'DISABLED' ? 'high' : 'medium' },
            userId: '',
        },
    });

    if (status === 'DELETED' || status === 'DISABLED') {
        await prisma.integrationConfig.updateMany({
            where: { companyId, provider: 'LINKEDIN_ADS' },
            data: { isEnabled: false },
        });
    }
}

// ─── AD CREATIVE STATUS HANDLER ──────────────────────────────────────────────

async function handleAdCreativeStatusChange(
    companyId: string,
    event: LinkedInStatusEvent
) {
    const campaignUrn = event.campaignUrn ?? '';
    const status = event.campaignStatus ?? 'UNKNOWN';
    const creativeId = campaignUrn.split(':').pop() ?? campaignUrn;

    console.log(`[LinkedIn Webhook] Ad creative status change: ${creativeId} → ${status}`);

    await prisma.notification.create({
        data: {
            type: 'AD_CREATIVE_STATUS',
            title: `LinkedIn Ad: ${status}`,
            message: `Creative ${creativeId} changed to status: ${status}`,
            companyId,
            metadata: { severity: status === 'REJECTED' ? 'high' : 'low' },
            userId: '',
        },
    });
}

// ─── MEMBER FOLLOW HANDLER ─────────────────────────────────────────────────

async function handleMemberFollowAction(
    companyId: string,
    event: LinkedInStatusEvent
) {
    const memberUrn = event.memberUrn ?? '';
    const action = event.action ?? 'UNKNOWN';
    const memberId = memberUrn.split(':').pop() ?? memberUrn;

    console.log(`[LinkedIn Webhook] Member follow action: ${memberId} → ${action}`);

    await prisma.notification.create({
        data: {
            type: 'MEMBER_FOLLOW',
            title: `New LinkedIn Follower`,
            message: action === 'FOLLOW' 
                ? `User ${memberId} started following your organization`
                : `User ${memberId} unfollowed your organization`,
            companyId,
            metadata: { severity: 'low' },
            userId: '',
        },
    });
}

// ─── ROUTE HANDLER ───────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
    const mode = req.nextUrl.searchParams.get('hub.mode');
    const token = req.nextUrl.searchParams.get('hub.verify_token');
    const challenge = req.nextUrl.searchParams.get('hub.challenge');
    const companyId = req.nextUrl.searchParams.get('companyId') ?? '';

    // Verify against DB config or env
    let validToken = false;
    if (companyId) {
        const dbConfig = await getLinkedInConfig(companyId);
        validToken = token === (dbConfig?.linkedinWebhookSecret || process.env.LINKEDIN_WEBHOOK_SECRET);
    } else {
        validToken = token === process.env.LINKEDIN_WEBHOOK_SECRET;
    }

    if (mode === 'subscribe' && validToken) {
        return new NextResponse(challenge, { status: 200 });
    }

    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}

export async function POST(req: NextRequest) {
    const rawBody = await req.text();
    const signature = req.headers.get('x-li-signature');
    const companyId = req.nextUrl.searchParams.get('companyId') ?? '';

    const isValid = await verifyLinkedInSignature(rawBody, signature, companyId || undefined);

    if (!isValid) {
        if (process.env.LINKEDIN_CLIENT_SECRET || process.env.LINKEDIN_WEBHOOK_SECRET) {
            return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
        }
    }

    try {
        const payload = JSON.parse(rawBody) as Record<string, unknown>;
        const companyId = req.nextUrl.searchParams.get('companyId') ?? '';

        // Check for status events (new webhook format)
        if (payload.eventType) {
            const statusEvent = payload as unknown as LinkedInStatusEvent;
            const eventId = statusEvent.eventId ?? `${Date.now()}`;

            if (await isEventProcessed(eventId)) {
                return NextResponse.json({ received: true, duplicate: true });
            }

            switch (statusEvent.eventType) {
                case 'ORGANIZATION_STATUS_CHANGE':
                    await handleOrganizationStatusChange(companyId, statusEvent);
                    break;
                case 'AD_CREATIVE_STATUS_CHANGE':
                    await handleAdCreativeStatusChange(companyId, statusEvent);
                    break;
                case 'MEMBER_FOLLOW_ACTION':
                    await handleMemberFollowAction(companyId, statusEvent);
                    break;
                default:
                    console.log(`[LinkedIn Webhook] Unknown event type: ${statusEvent.eventType}`);
            }

            await markEventProcessed(eventId, statusEvent.eventType);
            return NextResponse.json({ received: true });
        }

        // Legacy format: Ad insights data
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
