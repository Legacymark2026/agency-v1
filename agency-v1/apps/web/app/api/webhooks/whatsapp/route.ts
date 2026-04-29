import { NextResponse, NextRequest } from "next/server";
import { automationHub } from "@/lib/integrations/providers";
import { InboundMessage } from "@/lib/integrations/types";
import { db } from "@/lib/db";
import { createConversation } from "@/actions/inbox";

export async function GET(request: NextRequest) {
    const waProvider = automationHub.get('WHATSAPP');
    if (!waProvider) return NextResponse.json({ error: "Provider missing" }, { status: 500 });
    
    // Validates hub.verify_token and hub.mode directly using the Provider
    const isValid = await waProvider.validateWebhook(request as any);
    if (isValid) {
        const url = new URL(request.url);
        return new NextResponse(url.searchParams.get("hub.challenge"), { status: 200 });
    }
    
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export async function POST(request: NextRequest) {
    try {
        const waProvider = automationHub.get('WHATSAPP');
        if (!waProvider) return NextResponse.json({ error: "WhatsApp provider missing" }, { status: 500 });

        // Clone the request for signature verification because the body can only be read once
        const clonedReq = request.clone();
        const isSignatureValid = await waProvider.verifySignature(clonedReq as any);
        
        if (!isSignatureValid) {
            console.warn("[Meta Webhook] Invalid WhatsApp signature");
            return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
        }

        const msg: InboundMessage | null = await waProvider.parseWebhook(request as any);
        
        if (msg) {
             const phoneNumberId = msg.metadata?.phoneNumberId;
             let companyId = ""; 
             
             const configs = await db.integrationConfig.findMany({ where: { provider: 'whatsapp', isEnabled: true } });
             const validConfig = configs.find(c => (c.config as any)?.phoneNumberId === phoneNumberId);
             
             if (validConfig) companyId = validConfig.companyId;
             else if (configs.length > 0) companyId = configs[0].companyId;
             else {
                 const firstCompany = await db.company.findFirst();
                 if(firstCompany) companyId = firstCompany.id;
             }

             if (companyId) {
                 // Auto-create lead with UPSERT to avoid race conditions (P0-1 fix)
                 const guestEmail = `${msg.sender.id}@wa.guest`;
                 const lead = await db.lead.upsert({
                     where: {
                         companyId_email: {
                             companyId: companyId,
                             email: guestEmail
                         }
                     },
                     update: {}, // If it exists, do not modify (prevent overriding names)
                     create: {
                         companyId: companyId,
                         name: msg.sender.name || "WhatsApp Client",
                         email: guestEmail,
                         phone: msg.sender.id,
                         source: "WHATSAPP",
                         status: "NEW"
                     }
                 });

                 if (lead) {
                     const convRes = await createConversation(companyId, lead.id, 'WHATSAPP');
                     if (convRes.success && convRes.data) {
                         const conversationId = convRes.data.id;
                         
                         // Deduplicate by platform message ID (idempotent — safe against Meta retries)
                         const existingMsg = await db.message.findFirst({
                             where: { conversationId, externalId: msg.externalId }
                         });

                         if (!existingMsg) {
                             // Resolve media URL: if it's a WhatsApp media ID, make it a proxy URL
                             let resolvedMediaUrl = typeof msg.metadata?.mediaUrl === 'string' ? msg.metadata.mediaUrl : null;
                             let resolvedMediaType = typeof msg.metadata?.mediaType === 'string' ? msg.metadata.mediaType : null;
                             
                             // If media URL is just an ID (no slashes), convert to proxy URL
                             if (resolvedMediaUrl && !resolvedMediaUrl.includes('/') && !resolvedMediaUrl.includes('http')) {
                                 resolvedMediaUrl = `/api/media/whatsapp/${resolvedMediaUrl}`;
                             }
                             
                             // Detect audio from content or metadata
                             const isAudio = resolvedMediaType?.toLowerCase().includes('audio') || 
                                           msg.content?.toLowerCase().includes('nota de voz') ||
                                           msg.metadata?.messageType === 'audio';
                             
                             if (isAudio && !resolvedMediaType) {
                                 resolvedMediaType = 'AUDIO';
                             }
                             
                             const messageContent = isAudio && (!msg.content || msg.content === '[Media]') 
                                 ? '🎤 Nota de Voz' 
                                 : msg.content;

                             await db.message.create({
                                 data: {
                                     conversationId,
                                     content: messageContent,
                                     direction: 'INBOUND',
                                     senderId: msg.sender.id,
                                     status: 'DELIVERED',
                                     mediaUrl: resolvedMediaUrl,
                                     mediaType: resolvedMediaType
                                 }
                             });
                             
                             await db.conversation.update({
                                 where: { id: conversationId },
                                 data: { 
                                     unreadCount: { increment: 1 },
                                     lastMessageAt: new Date(),
                                     lastMessagePreview: msg.content.substring(0, 50),
                                     status: 'OPEN'
                                 }
                             });
                             
                             // Dispatch OmniChannel AI Agent transparently in the background
                             const { triggerOmnichannelAgent } = await import('@/lib/services/ai-inbox');
                             triggerOmnichannelAgent(conversationId, companyId).catch(err => 
                                 console.error("[WhatsApp Webhook] Error triggering AI Agent:", err)
                             );
                         }
                     }
                 }
             }
        }
        
        return NextResponse.json({ success: true, processed: !!msg });
    } catch (error) {
        console.error("WhatsApp Webhook Error:", error);
        // Meta expects 200 OK even on errors, otherwise it retries endlessly.
        return NextResponse.json({ received: true }, { status: 200 }); 
    }
}
