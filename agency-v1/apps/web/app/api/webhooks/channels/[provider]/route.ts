
import { NextRequest, NextResponse } from "next/server";
import { automationHub } from "@/lib/integrations/providers";
import { ChannelType } from "@/types/inbox";
import { prisma } from "@/lib/prisma";
import { createLead } from "@/modules/leads/actions/leads";
import { analyzeIncomingMessage } from "@/lib/services/ai-inbox";

// ─────────────────────────────────────────────────────────────────────────────
// P1-B: In-Memory Company Resolution Cache
// Evita un findMany + JS filter en cada mensaje entrante.
// TTL: 5 minutos — balance entre consistencia y performance.
// ─────────────────────────────────────────────────────────────────────────────
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 min
const companyCache = new Map<string, { companyId: string; expiresAt: number }>();

async function resolveCompanyId(recipientId: string | undefined, channel: string): Promise<string | null> {
    // Fast-path: no recipientId → skip cache, fall through to default company
    if (recipientId) {
        const cacheKey = `${channel}:${recipientId}`;
        const cached = companyCache.get(cacheKey);

        if (cached && cached.expiresAt > Date.now()) {
            return cached.companyId;
        }

        // Cache miss — query DB
        const integrations = await prisma.integrationConfig.findMany({
            where: { provider: channel, isEnabled: true },
            select: { companyId: true, config: true },
        });

        const match = integrations.find((int) => {
            const configStr = JSON.stringify(int.config);
            return configStr.includes(String(recipientId));
        });

        if (match) {
            companyCache.set(cacheKey, { companyId: match.companyId, expiresAt: Date.now() + CACHE_TTL_MS });
            return match.companyId;
        }
    }

    // Fallback: first company (single-tenant / dev)
    const defaultCompany = await prisma.company.findFirst({ select: { id: true } });
    return defaultCompany?.id ?? null;
}

// Map URL param to ChannelType
const getChannelFromProvider = (provider: string): ChannelType | null => {
    switch (provider.toLowerCase()) {
        case 'facebook': return 'MESSENGER';
        case 'instagram': return 'INSTAGRAM';
        case 'twitter': return 'TWITTER';
        case 'linkedin': return 'LINKEDIN';
        case 'youtube': return 'YOUTUBE';
        case 'whatsapp': return 'WHATSAPP';
        default: return null;
    }
};

export async function POST(
    req: NextRequest,
    params: { params: Promise<{ provider: string }> }
) {
    return handlePost(req, params);
}

export async function GET(
    req: NextRequest,
    props: { params: Promise<{ provider: string }> }
) {
    const params = await props.params;
    const { provider } = params;
    const channel = getChannelFromProvider(provider);
    if (!channel) return new NextResponse("Invalid provider", { status: 400 });

    const channelProvider = automationHub.get(channel);
    if (!channelProvider) return new NextResponse("Provider not configured", { status: 501 });

    const isValid = await channelProvider.validateWebhook(req);
    if (isValid) {
        const url = new URL(req.url);
        const challenge = url.searchParams.get("hub.challenge");
        return new NextResponse(challenge);
    }

    return new NextResponse("Invalid verification token", { status: 403 });
}

async function handlePost(
    req: NextRequest,
    { params }: { params: Promise<{ provider: string }> }
) {
    const { provider } = await params;
    const channel = getChannelFromProvider(provider);

    if (!channel) {
        return NextResponse.json({ error: "Invalid provider" }, { status: 400 });
    }

    const channelProvider = automationHub.get(channel);
    if (!channelProvider) {
        return NextResponse.json({ error: "Provider not configured" }, { status: 501 });
    }

    try {
        // 0. Verify Signature (Security)
        const isVerified = await channelProvider.verifySignature(req);
        if (!isVerified) {
            console.error(`[Webhook:${channel}] Invalid Signature`);
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // 1. Parse incoming webhook
        const inboundMessage = await channelProvider.parseWebhook(req);

        if (!inboundMessage) {
            return NextResponse.json({ message: "Ignored event" });
        }

        // 2. Resolve Company (Multi-Tenant Support) — P1-B cached
        const recipientId = inboundMessage.metadata?.recipientId || inboundMessage.metadata?.phoneNumberId || inboundMessage.metadata?.pageId as string | undefined;
        const companyId = await resolveCompanyId(recipientId as string | undefined, channel);


        if (!companyId) {
            console.error(`[Webhook:${channel}] No company resolved for recipient ${recipientId}`);
            return NextResponse.json({ error: "Configuration Error" }, { status: 500 });
        }
        
        const validCompanyId = companyId;

        // 3. Find or Create Lead
        let lead = await prisma.lead.findFirst({
            where: {
                OR: [
                    { phone: inboundMessage.sender.id },
                    { email: `${channel.toLowerCase()}_${inboundMessage.sender.id}@placeholder.com` }
                ],
                companyId: validCompanyId
            }
        });

        if (!lead) {
            // Create a new lead for this user with a safer, channel-specific placeholder
            const placeholderEmail = `${channel.toLowerCase()}_${inboundMessage.sender.id}@placeholder.com`;

            const result = await createLead({
                email: placeholderEmail,
                companyId: validCompanyId,
                name: inboundMessage.sender.name || `${channel} User`,
                phone: channel === 'WHATSAPP' || channel === 'SMS' ? inboundMessage.sender.id : undefined,
                utmSource: channel.toLowerCase(),
                tags: [`${channel.toLowerCase()}-inbound`]
            });

            if (result.success && result.data) {
                lead = result.data as any;
            } else {
                console.error("Failed to create lead from Webhook:", result.error);
                // Continue without linking lead? Or fail? 
                // We will proceed to save the message but leadId will be null
            }
        }

        // 4. Find or Create Conversation
        // For WhatsApp/SMS, the platformId is the phone number (sender.id)
        // For Messenger/Instagram, it's the PSID (sender.id)
        const conversationPlatformId = inboundMessage.sender.id;

        let conversation = await prisma.conversation.findFirst({
            where: {
                platformId: conversationPlatformId,
                channel: channel,
                companyId: validCompanyId
            }
        });

        if (!conversation) {
            const analysis = await analyzeIncomingMessage(inboundMessage.content);
            conversation = await prisma.conversation.create({
                data: {
                    channel: channel,
                    platformId: conversationPlatformId,
                    companyId: validCompanyId,
                    leadId: lead?.id,
                    status: 'OPEN',
                    unreadCount: 1,
                    lastMessageAt: new Date(),
                    lastMessagePreview: inboundMessage.content.substring(0, 100),
                    sentiment: analysis.sentiment,
                    topic: analysis.topic,
                    metadata: inboundMessage.metadata ? JSON.parse(JSON.stringify(inboundMessage.metadata)) : undefined
                }
            });
        } else {
            // Analyze the incoming message with Gemini
            const analysis = await analyzeIncomingMessage(inboundMessage.content);

            const priority = (analysis.sentiment === 'URGENT' || analysis.sentiment === 'NEGATIVE') ? 'URGENT' : 'MEDIUM';

            // Update conversation state with AI sentiment/topic
            await prisma.conversation.update({
                where: { id: conversation.id },
                data: {
                    unreadCount: { increment: 1 },
                    lastMessageAt: new Date(),
                    lastMessagePreview: inboundMessage.content.substring(0, 100),
                    status: conversation.status === 'ARCHIVED' ? 'OPEN' : conversation.status,
                    sentiment: analysis.sentiment,
                    topic: analysis.topic,
                    priority: priority
                }
            });
            // Attach analysis to block scope variable for dispatch logic
            conversation.sentiment = analysis.sentiment;
        }

        // 4. Link Lead to Conversation if not already linked
        if (lead && !conversation.leadId) {
            await prisma.conversation.update({
                where: { id: conversation.id },
                data: { leadId: lead.id }
            });
            conversation.leadId = lead.id; // Update local object
        }

        // 5. Create Message — deduplicate by externalId, persist media
        const existingMsg = await prisma.message.findFirst({
            where: {
                conversationId: conversation.id,
                externalId: inboundMessage.externalId,
            }
        });

        if (existingMsg) {
            console.log(`[Webhook:${channel}] Duplicate externalId=${inboundMessage.externalId}, skipping.`);
            return NextResponse.json({ success: true });
        }

        // Resolve media from metadata or attachments array
        const mediaUrl: string | null =
            (inboundMessage.metadata?.mediaUrl as string | undefined) ??
            inboundMessage.attachments?.[0]?.url ??
            inboundMessage.images?.[0] ??
            null;

        // Map attachment type string → DB enum string (e.g. 'audio' → 'AUDIO')
        const rawMediaType =
            (inboundMessage.metadata?.mediaType as string | undefined) ??
            (inboundMessage.attachments?.[0]?.type?.toUpperCase()) ??
            (inboundMessage.images?.length ? 'IMAGE' : null);
        const mediaType = rawMediaType ?? (mediaUrl ? 'DOCUMENT' : 'TEXT');

        const message = await prisma.message.create({
            data: {
                conversationId: conversation.id,
                externalId: inboundMessage.externalId,
                content: inboundMessage.content,
                senderId: inboundMessage.sender.id,
                mediaUrl,
                mediaType: mediaType as any,
                metadata: {
                    ...inboundMessage.metadata,
                    senderName: inboundMessage.sender.name,
                    senderAvatar: inboundMessage.sender.avatar,
                },
                direction: 'INBOUND',
                status: 'DELIVERED',
            }
        });

        // 6. Triage & Dispatch (P2-2 & P2-1)
        if (conversation.sentiment === 'NEGATIVE' || conversation.sentiment === 'URGENT') {
             // Assign to the first available admin if unassigned, and pause the bot by skipping the trigger
             const admin = await prisma.user.findFirst({ where: { companies: { some: { companyId: validCompanyId } }, role: 'admin' } });
             if (admin && !conversation.assignedTo) {
                 await prisma.conversation.update({ where: { id: conversation.id }, data: { assignedTo: admin.id } });
                 
                 // Notify admin via Local Notification
                 const { createLocalNotification } = await import("@/actions/notifications");
                 createLocalNotification({ 
                     companyId: validCompanyId, 
                     userId: admin.id, 
                     type: 'LEAD_ACTIVITY', 
                     title: `Triage: Cliente Frustrado/Urgente`, 
                     message: inboundMessage.content.substring(0, 100), 
                     link: `/dashboard/inbox?conversation=${conversation.id}` 
                 }).catch(console.error);
             }
             
             // P2-1: Pre-compute copilot draft since bot is paused and human is needed
             const { draftCopilotReply } = await import('@/lib/services/ai-inbox');
             draftCopilotReply(conversation.id).catch(console.error);
        } else {
             // Dispatch OmniChannel AI Agent in background for standard messages
             try {
                 const { triggerOmnichannelAgent } = await import('@/lib/services/ai-inbox');
                 triggerOmnichannelAgent(conversation.id, validCompanyId).catch(err =>
                     console.error(`[Webhook:${channel}] Error triggering AI Agent:`, err)
                 );
             } catch (agentErr) {
                 console.warn(`[Webhook:${channel}] AI Agent import failed:`, agentErr);
             }
        }

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error(`[Webhook:${channel}] Error:`, error);
        return NextResponse.json({ error: error.message || "Internal Server Error", stack: error.stack }, { status: 500 });
    }
}
