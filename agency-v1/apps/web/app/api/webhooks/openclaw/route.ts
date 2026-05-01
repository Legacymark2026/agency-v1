import { NextResponse, NextRequest } from "next/server";
import { db } from "@/lib/db";
import { createConversation } from "@/actions/inbox";

/**
 * Universal webhook receiver for OpenClaw Gateway.
 * Receives normalized payloads from WhatsApp, Telegram, Slack, etc.
 */
export async function POST(request: NextRequest) {
    try {
        const secret = request.headers.get("x-openclaw-secret");
        if (secret !== process.env.OPENCLAW_WEBHOOK_SECRET) {
            console.warn("[OpenClaw Webhook] Unauthorized request");
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const payload = await request.json();
        
        // OpenClaw Payload Schema expectation:
        // { id, channel, sender: { id, name }, content, metadata: { mediaUrl, mediaType } }
        
        const { id, channel, sender, content, metadata } = payload;
        
        if (!channel || !sender || !sender.id) {
            return NextResponse.json({ error: "Invalid payload structure" }, { status: 400 });
        }

        // For this unified webhook, we assign to the first active company or a specific one if provided in metadata
        let companyId = metadata?.companyId;
        
        if (!companyId) {
            const firstCompany = await db.company.findFirst();
            if (firstCompany) companyId = firstCompany.id;
        }

        if (!companyId) {
             return NextResponse.json({ error: "No company context found" }, { status: 400 });
        }

        // 1. Upsert Lead
        const guestEmail = `${sender.id}@${channel.toLowerCase()}.guest`;
        const lead = await db.lead.upsert({
            where: {
                companyId_email: {
                    companyId: companyId,
                    email: guestEmail
                }
            },
            update: {}, // Prevent overriding names if already exists
            create: {
                companyId: companyId,
                name: sender.name || `${channel} User`,
                email: guestEmail,
                phone: channel === 'WHATSAPP' ? sender.id : null,
                source: channel,
                status: "NEW"
            }
        });

        if (!lead) return NextResponse.json({ error: "Failed to create lead" }, { status: 500 });

        // 2. Create/Get Conversation
        const convRes = await createConversation(companyId, lead.id, channel);
        if (!convRes.success || !convRes.data) {
             return NextResponse.json({ error: "Failed to create conversation" }, { status: 500 });
        }
        
        const conversationId = convRes.data.id;

        // 3. Deduplicate Message
        const existingMsg = await db.message.findFirst({
            where: { conversationId, externalId: id }
        });

        if (!existingMsg) {
            await db.message.create({
                data: {
                    conversationId,
                    content: content || '[Media]',
                    direction: 'INBOUND',
                    senderId: sender.id,
                    status: 'DELIVERED',
                    externalId: id,
                    mediaUrl: metadata?.mediaUrl || null,
                    mediaType: metadata?.mediaType || null
                }
            });
            
            await db.conversation.update({
                where: { id: conversationId },
                data: { 
                    unreadCount: { increment: 1 },
                    lastMessageAt: new Date(),
                    lastMessagePreview: (content || '[Media]').substring(0, 50),
                    status: 'OPEN'
                }
            });
            
            // 4. Dispatch Omnichannel AI Agent
            const { triggerOmnichannelAgent } = await import('@/lib/services/ai-inbox');
            triggerOmnichannelAgent(conversationId, companyId).catch(err => 
                console.error(`[OpenClaw Webhook] Error triggering AI Agent for ${channel}:`, err)
            );
        }

        return NextResponse.json({ success: true, processed: true });

    } catch (error) {
        console.error("OpenClaw Webhook Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
