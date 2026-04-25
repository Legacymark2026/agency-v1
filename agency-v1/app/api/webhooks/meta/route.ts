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

// ─── AD INSIGHT NORMALIZER ───────────────────────────────────────────────────

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

// ─── AD SPEND UPSERT ─────────────────────────────────────────────────────────

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

    if (!whereClause) return;

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

// ─── INCOMING MESSAGE HANDLER ─────────────────────────────────────────────────

/**
 * Processes a single incoming Meta messaging event (Messenger or Instagram DM).
 * Resolves company via IntegrationConfig page mapping, then upserts
 * lead → conversation → message and triggers the AI Copilot agent.
 */
async function processIncomingMessage(
    pageId: string,
    senderId: string,
    recipientId: string,
    messageId: string,
    messageText: string,
    timestamp: number,
    channel: 'MESSENGER' | 'INSTAGRAM',
    attachments: Array<Record<string, any>> = []
) {
    try {
        console.log(`[Meta Webhook] Incoming ${channel} message from sender ${senderId} on page ${pageId}`);

        // 1. Find the company that owns this page (check new and legacy providers)
        let companyId: string | null = null;

        const configs = await prisma.integrationConfig.findMany({
            where: {
                provider: { in: ['facebook-page', 'facebook', 'instagram-page'] }
            }
        });

        for (const cfg of configs) {
            const c = cfg.config as any;
            if (c?.pageId === pageId || c?.manualPageId === pageId) {
                companyId = cfg.companyId;
                break;
            }
        }

        // Fallback: first config or first company
        if (!companyId && configs.length > 0) {
            companyId = configs[0].companyId;
        }

        if (!companyId) {
            const firstCompany = await prisma.company.findFirst({ select: { id: true } });
            companyId = firstCompany?.id ?? null;
        }

        if (!companyId) {
            console.error('[Meta Webhook] Cannot process message: no company resolved.');
            return;
        }

        // 2. Find or create Lead (scoped social identifier so there are no email collisions)
        const prefix = channel === 'INSTAGRAM' ? 'ig' : 'fb';
        const socialEmail = `${prefix}-${senderId}@social.user`;

        let lead = await prisma.lead.findFirst({
            where: { companyId, email: socialEmail }
        });

        if (!lead) {
            lead = await prisma.lead.create({
                data: {
                    companyId,
                    name: `${channel === 'INSTAGRAM' ? 'Instagram' : 'Facebook'} User …${senderId.slice(-4)}`,
                    email: socialEmail,
                    source: channel,
                    status: 'NEW',
                }
            });
            console.log(`[Meta Webhook] Created lead: ${lead.id}`);
        }

        // 3. Find or create Conversation
        let conversation = await prisma.conversation.findFirst({
            where: { companyId, leadId: lead.id, channel }
        });

        let mediaUrl = undefined;
        let mediaType = undefined;
        let finalMessageText = messageText || '';

        if (attachments && attachments.length > 0) {
            const attachment = attachments[0];
            mediaUrl = attachment.payload?.url;

            if (attachment.type === 'audio') {
                mediaType = 'AUDIO';
                if (!finalMessageText) finalMessageText = '🎤 Nota de Voz';
            } else if (attachment.type === 'image') {
                mediaType = 'IMAGE';
                if (!finalMessageText) finalMessageText = '📷 Imagen';
            } else if (attachment.type === 'video') {
                mediaType = 'VIDEO';
                if (!finalMessageText) finalMessageText = '🎥 Video';
            } else if (attachment.type === 'file') {
                mediaType = 'DOCUMENT';
                if (!finalMessageText) finalMessageText = '📄 Archivo';
            } else {
                mediaType = attachment.type?.toUpperCase();
                if (!finalMessageText) finalMessageText = `[${attachment.type}]`;
            }
        }

        if (!finalMessageText) finalMessageText = '[Media]';

        const preview = finalMessageText?.substring(0, 80);
        const msgTime = new Date(timestamp * 1000);

        if (!conversation) {
            conversation = await prisma.conversation.create({
                data: {
                    companyId,
                    leadId: lead.id,
                    channel,
                    status: 'OPEN',
                    lastMessageAt: msgTime,
                    lastMessagePreview: preview,
                    unreadCount: 1,
                    metadata: { pageId, recipientId: senderId }
                }
            });
            console.log(`[Meta Webhook] Created conversation: ${conversation.id}`);
        } else {
            await prisma.conversation.update({
                where: { id: conversation.id },
                data: {
                    status: 'OPEN',
                    lastMessageAt: msgTime,
                    lastMessagePreview: preview,
                    unreadCount: { increment: 1 },
                    metadata: { pageId, recipientId: senderId }
                }
            });
        }

        // 4. Deduplicate: check if this platformMessageId already exists in metadata
        const existingMessages = await prisma.message.findMany({
            where: { conversationId: conversation.id },
            select: { id: true, metadata: true },
            orderBy: { createdAt: 'desc' },
            take: 50,
        });

        const alreadyExists = existingMessages.some((m: any) => {
            const meta = m.metadata as any;
            return meta?.platformMessageId === messageId;
        });

        if (alreadyExists) {
            console.log(`[Meta Webhook] Duplicate messageId=${messageId}, skipping.`);
            return;
        }

        // 5. Persist the Message
        await prisma.message.create({
            data: {
                conversationId: conversation.id,
                content: finalMessageText,
                direction: 'INBOUND',
                status: 'RECEIVED',
                senderId: lead.id,
                createdAt: msgTime,
                externalId: messageId,
                mediaUrl: mediaUrl,
                mediaType: mediaType,
                metadata: { platformMessageId: messageId, pageId }
            }
        });

        console.log(`[Meta Webhook] Message saved. conversationId=${conversation.id}`);

        // 6. Trigger AI Copilot (fire-and-forget)
        import('@/lib/services/ai-inbox').then(({ triggerOmnichannelAgent }) => {
            triggerOmnichannelAgent(conversation!.id, companyId!).catch((err: any) =>
                console.error('[Meta Webhook] AI dispatch failed:', err)
            );
        }).catch(() => {});

        // 7. Create team notifications (fire-and-forget)
        import('@/actions/notifications').then(async ({ createLocalNotification }) => {
            const admins = await prisma.user.findMany({
                where: { companyId: companyId! } as any,
                select: { id: true },
                take: 20,
            });
            const channelLabel = channel === 'INSTAGRAM' ? 'Instagram' : 'Messenger';
            await Promise.all((admins as { id: string }[]).map(admin =>
                createLocalNotification({
                    companyId: companyId!,
                    userId: admin.id,
                    type: 'NEW_MESSAGE',
                    title: `Nuevo mensaje — ${channelLabel}`,
                    message: preview,
                    link: `/dashboard/inbox?conversation=${conversation!.id}`
                }).catch(() => {})
            ));
        }).catch(() => {});

    } catch (err) {
        console.error('[Meta Webhook] processIncomingMessage error:', err);
    }
}

// ─── ROUTE HANDLERS ───────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
    const mode = req.nextUrl.searchParams.get('hub.mode');
    const token = req.nextUrl.searchParams.get('hub.verify_token');
    const challenge = req.nextUrl.searchParams.get('hub.challenge');

    if (mode === 'subscribe' && token === process.env.META_WEBHOOK_VERIFY_TOKEN) {
        console.log('[Meta Webhook] Challenge accepted');
        return new NextResponse(challenge, { status: 200 });
    }

    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}

export async function POST(req: NextRequest) {
    const rawBody = await req.text();
    const signature = req.headers.get('x-hub-signature-256');

    if (!verifyMetaSignature(rawBody, signature)) {
        console.error('[Meta Webhook] Signature mismatch — rejected');
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    try {
        const payload = JSON.parse(rawBody) as Record<string, unknown>;
        const object = payload.object as string;

        console.log(`[Meta Webhook] POST received, object=${object}`);

        const entries = (payload.entry as Array<Record<string, unknown>>) ?? [];

        for (const entry of entries) {
            const pageId = entry.id as string;

            // ── A. Messenger: entry.messaging[] ───────────────────────────────
            const messaging = (entry.messaging as Array<Record<string, unknown>>) ?? [];
            for (const event of messaging) {
                const sender = event.sender as { id: string } | undefined;
                const recipient = event.recipient as { id: string } | undefined;
                const message = event.message as Record<string, unknown> | undefined;
                const timestamp = event.timestamp as number | undefined;

                if (!sender || !message) continue;
                if ((message as any).is_echo) continue; // skip own echoes

                await processIncomingMessage(
                    pageId,
                    sender.id,
                    recipient?.id ?? pageId,
                    (message.mid as string) || `tmp-${Date.now()}`,
                    (message.text as string) || '',
                    timestamp ?? Math.floor(Date.now() / 1000),
                    object === 'instagram' ? 'INSTAGRAM' : 'MESSENGER',
                    (message.attachments as Array<Record<string, any>>) || []
                );
            }

            // ── B. Instagram + Ad-account: entry.changes[] ────────────────────
            const changes = (entry.changes as Array<Record<string, unknown>>) ?? [];
            for (const change of changes) {

                // B1. Instagram messages via changes.field = 'messages'
                if (change.field === 'messages') {
                    const value = change.value as Record<string, unknown>;
                    const sender = value.sender as { id: string } | undefined;
                    const recipient = value.recipient as { id: string } | undefined;
                    const message = value.message as Record<string, unknown> | undefined;
                    const timestamp = value.timestamp as number | undefined;

                    if (!sender || !message) continue;
                    if ((message as any).is_echo) continue;

                    await processIncomingMessage(
                        pageId,
                        sender.id,
                        recipient?.id ?? pageId,
                        (message.mid as string) || `tmp-${Date.now()}`,
                        (message.text as string) || '',
                        timestamp ?? Math.floor(Date.now() / 1000),
                        'INSTAGRAM',
                        (message.attachments as Array<Record<string, any>>) || []
                    );
                }

                // B2. Ad account changes (existing analytics behavior)
                if (change.field === 'adaccount') {
                    const value = change.value as Record<string, unknown>;
                    console.log('[Meta Webhook] Ad account change signal:', value);
                }
            }
        }

        // ── C. Direct insights push (Conversions API / Reporting webhooks) ────
        if (object === 'insights') {
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

                await upsertDailySpend(companyId, campaign?.id ?? null, 'FACEBOOK_ADS', date, normalized);
            }
        }

        return NextResponse.json({ received: true });
    } catch (err) {
        console.error('[Meta Webhook] POST processing error:', err);
        return NextResponse.json({ error: 'Processing failed' }, { status: 500 });
    }
}
