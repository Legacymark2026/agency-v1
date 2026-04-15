import { NextRequest, NextResponse } from 'next/server';
import { db as prisma } from '@/lib/db';
import crypto from 'crypto';

async function getTikTokConfig(companyId: string) {
    if (!companyId) return null;
    try {
        const config = await prisma.integrationConfig.findUnique({
            where: { companyId_provider: { companyId, provider: 'tiktok-messages' } },
        });
        return config?.config as Record<string, string> | null;
    } catch {
        return null;
    }
}

async function verifyTikTokSignature(
    rawBody: string,
    timestamp: string | null,
    nonce: string | null,
    signature: string | null,
    companyId?: string
): Promise<boolean> {
    if (!signature || !timestamp || !nonce) return false;

    // Try DB config first
    let secret: string | undefined;
    let appId: string | undefined;
    
    if (companyId) {
        const dbConfig = await getTikTokConfig(companyId);
        if (dbConfig) {
            secret = dbConfig.tiktokWebhookSecret || dbConfig.tiktokClientSecret;
            appId = dbConfig.tiktokAppId;
        }
    }
    
    // Fall back to env
    secret = secret || process.env.TIKTOK_WEBHOOK_SECRET || process.env.TIKTOK_CLIENT_SECRET;
    appId = appId || process.env.TIKTOK_APP_ID;

    if (!secret) return false;

    const signString = [
        appId ?? '',
        timestamp,
        nonce,
        rawBody
    ].sort().join('');

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
            platform: 'TIKTOK',
            processedAt: new Date(),
        },
    });
}

interface TikTokCommentEvent {
    event_type: string;
    event_id: string;
    open_id: string;
    video_id: string;
    comment_id: string;
    text: string;
    create_time: number;
    [key: string]: unknown;
}

interface TikTokUserUpdateEvent {
    event_type: 'user.info.update';
    event_id: string;
    open_id: string;
    field: string;
    new_value: string;
    update_time: number;
    [key: string]: unknown;
}

interface TikTokContentInspectionEvent {
    event_type: 'content_inspection.completed';
    event_id: string;
    video_id: string;
    status: 'APPROVED' | 'REJECTED' | 'TAKEN_DOWN';
    reason?: string;
    [key: string]: unknown;
}

async function handleCommentCreated(
    companyId: string,
    event: TikTokCommentEvent
) {
    const { video_id, comment_id, text, open_id, create_time } = event;

    console.log(`[TikTok Webhook] New comment: ${comment_id} on video ${video_id}`);

    const timestamp = create_time * 1000;
    const platform = 'TIKTOK';
    const userId = open_id.split(':').pop() ?? open_id;
    const syntheticEmail = `tiktok-${userId}@social.user`;

    // 1. Find or create Lead
    const lead = await prisma.lead.upsert({
        where: {
            companyId_email: {
                email: syntheticEmail,
                companyId,
            },
        },
        update: {
            name: userId,
        },
        create: {
            email: syntheticEmail,
            name: userId,
            companyId,
            source: platform,
        },
    });

    // 2. Find or create Conversation (for Inbox)
    const threadId = `tiktok-${userId}`;
    let conversation = await prisma.conversation.findFirst({
        where: {
            companyId,
            leadId: lead.id,
            channel: platform,
        },
    });

    if (!conversation) {
        conversation = await prisma.conversation.create({
            data: {
                companyId,
                leadId: lead.id,
                channel: platform,
                platformId: threadId,
                status: 'OPEN',
            },
        });
        console.log(`[TikTok Webhook] Created new conversation for ${platform}`);
    }

    // 3. Check for duplicate message
    const existingMessage = await prisma.message.findFirst({
        where: {
            conversationId: conversation.id,
            content: text,
            createdAt: {
                gte: new Date(timestamp - 5000),
                lte: new Date(timestamp + 5000)
            }
        }
    });

    if (!existingMessage) {
        // Create Message in Inbox
        await prisma.message.create({
            data: {
                conversationId: conversation.id,
                content: text,
                direction: 'INBOUND',
                status: 'DELIVERED',
                senderId: lead.id,
                externalId: comment_id,
                createdAt: new Date(timestamp)
            }
        });
        console.log(`[TikTok Webhook] Message saved to conversation ${conversation.id}`);

        // Update conversation
        await prisma.conversation.update({
            where: { id: conversation.id },
            data: {
                lastMessageAt: new Date(timestamp),
                lastMessagePreview: text.substring(0, 100)
            }
        });

        // Trigger AI Agent
        try {
            const { triggerOmnichannelAgent } = await import('@/lib/services/ai-inbox');
            triggerOmnichannelAgent(conversation.id, companyId).catch(err =>
                console.error('[TikTok Webhook] AI Trigger failed:', err)
            );
        } catch (err) {
            console.log('[TikTok Webhook] AI trigger not available, skipping');
        }
    }

    // 4. Also save to SocialPostComment if video tracked
    const socialPost = await prisma.socialPost.findFirst({
        where: {
            companyId,
        },
        select: { id: true },
    });

    /*
    if (socialPost?.id) {
        await prisma.socialPostComment.upsert({
            where: { id: comment_id },
            create: {
                id: comment_id,
                postId: socialPost.id,
                content: text,
                userId: "temp-user",
                createdAt: new Date(timestamp),
            },
            update: {
                content: text,
            },
        });
    }
    */

    // 5. Create notification
    await prisma.notification.create({
        data: {
            type: 'TIKTOK_COMMENT',
            title: 'New TikTok Comment',
            message: `New comment on video ${video_id}: ${text.slice(0, 100)}`,
            companyId,
            metadata: { severity: 'low', leadId: lead.id, conversationId: conversation.id },
            userId: '',
        },
    });
}

async function handleUserInfoUpdate(
    companyId: string,
    event: TikTokUserUpdateEvent
) {
    const { open_id, field, new_value } = event;
    const userId = open_id.split(':').pop() ?? open_id;

    console.log(`[TikTok Webhook] User info update: ${userId} changed ${field} to ${new_value}`);

    await prisma.notification.create({
        data: {
            type: 'TIKTOK_USER_UPDATE',
            title: 'TikTok User Updated Profile',
            message: `User ${userId} updated ${field}: ${new_value}`,
            companyId,
            metadata: { severity: 'low' },
            userId: '',
        },
    });
}

async function handleContentInspection(
    companyId: string,
    event: TikTokContentInspectionEvent
) {
    const { video_id, status, reason } = event;

    console.log(`[TikTok Webhook] Content inspection: ${video_id} → ${status}`);

    const notificationSeverity = status === 'REJECTED' || status === 'TAKEN_DOWN' 
        ? 'high' 
        : 'low';

    await prisma.notification.create({
        data: {
            type: 'TIKTOK_CONTENT_REVIEW',
            title: `TikTok Video: ${status}`,
            message: reason 
                ? `Video ${video_id} ${status.toLowerCase()}: ${reason}`
                : `Video ${video_id} marked as ${status.toLowerCase()}`,
            companyId,
            metadata: { severity: notificationSeverity },
            userId: '',
        },
    });
}

export async function GET(req: NextRequest) {
    const mode = req.nextUrl.searchParams.get('hub.mode');
    const token = req.nextUrl.searchParams.get('hub.verify_token');
    const challenge = req.nextUrl.searchParams.get('hub.challenge');
    const companyId = req.nextUrl.searchParams.get('companyId') ?? '';

    // Verify against DB config or env
    let validToken = false;
    if (companyId) {
        const dbConfig = await getTikTokConfig(companyId);
        validToken = token === (dbConfig?.tiktokWebhookSecret || process.env.TIKTOK_WEBHOOK_SECRET);
    } else {
        validToken = token === process.env.TIKTOK_WEBHOOK_SECRET;
    }

    if (mode === 'subscribe' && validToken) {
        return new NextResponse(challenge, { status: 200 });
    }

    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}

export async function POST(req: NextRequest) {
    const rawBody = await req.text();
    const timestamp = req.headers.get('x-tiktok-timestamp');
    const nonce = req.headers.get('x-tiktok-nonce');
    const signature = req.headers.get('x-tiktok-signature');
    const companyId = req.nextUrl.searchParams.get('companyId') ?? '';

    const isValid = await verifyTikTokSignature(rawBody, timestamp, nonce, signature, companyId || undefined);
    
    if (!isValid) {
        if (process.env.TIKTOK_WEBHOOK_SECRET || process.env.TIKTOK_CLIENT_SECRET) {
            return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
        }
    }

    try {
        const payload = JSON.parse(rawBody) as Record<string, unknown>;
        const companyId = req.nextUrl.searchParams.get('companyId') ?? '';

        const eventType = payload.event_type as string;
        const eventId = payload.event_id as string;

        if (await isEventProcessed(eventId)) {
            return NextResponse.json({ received: true, duplicate: true });
        }

        switch (eventType) {
            case 'comment.create':
            case 'comment.list':
                await handleCommentCreated(companyId, payload as unknown as TikTokCommentEvent);
                break;
            case 'comment.reply':
                await handleCommentCreated(companyId, payload as unknown as TikTokCommentEvent);
                break;
            case 'user.info.update':
                await handleUserInfoUpdate(companyId, payload as unknown as TikTokUserUpdateEvent);
                break;
            case 'content_inspection.completed':
                await handleContentInspection(companyId, payload as unknown as TikTokContentInspectionEvent);
                break;
            default:
                console.log(`[TikTok Webhook] Unknown event type: ${eventType}`);
        }

        if (eventId) {
            await markEventProcessed(eventId, eventType);
        }

        return NextResponse.json({ received: true });
    } catch (err) {
        console.error('[TikTok Webhook] Error:', err);
        return NextResponse.json({ error: 'Processing failed' }, { status: 500 });
    }
}