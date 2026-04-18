
import { ChannelType, ProcessingResult } from "@/types/inbox";
import { ChannelProvider, OutboundMessage, InboundMessage, Attachment } from "./types";
import { MetaService } from "@/lib/meta-service";
import crypto from "crypto";

export class InstagramProvider implements ChannelProvider {
    channel: ChannelType = 'INSTAGRAM';
    private pageAccessToken: string;

    constructor(token: string = '') {
        this.pageAccessToken = token;
    }

    async sendMessage(message: OutboundMessage): Promise<ProcessingResult> {
        console.log(`[InstagramProvider] Sending message to ${message.conversationId}`);

        if (!this.pageAccessToken) {
            return { success: false, error: "No Page Access Token available" };
        }

        try {
            // Instagram Messaging uses the same Graph API endpoint structure as Messenger
            // but the conversation/recipient ID is an IGSID (Instagram Scoped ID).
            const result = await MetaService.sendTextMessage(this.pageAccessToken, message.conversationId, message.content);
            return { success: true, messageId: result.message_id };
        } catch (error: any) /* eslint-disable-line @typescript-eslint/no-explicit-any */ {
            console.error("Instagram Send Error:", error);
            return { success: false, error: error.message };
        }
    }

    async verifySignature(request: Request): Promise<boolean> {
        const signature = request.headers.get("x-hub-signature-256");
        const appSecret = process.env.META_APP_SECRET;

        if (!appSecret) {
            console.warn("[InstagramProvider] META_APP_SECRET not set. Skipping verification (UNSAFE).");
            return true;
        }

        if (!signature) {
            console.warn("[InstagramProvider] No signature header found.");
            return false;
        }

        try {
            const body = await request.clone().arrayBuffer();
            const expectedSignature = "sha256=" + crypto
                .createHmac("sha256", appSecret)
                .update(Buffer.from(body))
                .digest("hex");

            return crypto.timingSafeEqual(
                Buffer.from(signature),
                Buffer.from(expectedSignature)
            );
        } catch (error) {
            console.error("[InstagramProvider] Signature verification failed:", error);
            return false;
        }
    }

    async validateWebhook(request: Request): Promise<boolean> {
        // Reuse Meta verification logic
        const url = new URL(request.url);
        const mode = url.searchParams.get("hub.mode");
        const token = url.searchParams.get("hub.verify_token");
        const verifyToken = process.env.META_WEBHOOK_VERIFY_TOKEN;

        return mode === "subscribe" && token === verifyToken;
    }

    async parseWebhook(request: Request): Promise<InboundMessage | null> {
        try {
            const body = await request.json();

            // Helper: build InboundMessage from a messaging event object
            const buildFromMessagingEvent = (event: Record<string, unknown>, pageId: string): InboundMessage | null => {
                const msg = event.message as Record<string, unknown> | undefined;
                if (!msg || (msg as any).is_echo) return null;

                const textContent = (msg.text as string) || '';

                const rawAttachments = (msg.attachments as Array<{ type: string; payload: { url?: string } }>) || [];
                const attachments: Attachment[] = rawAttachments.map(a => ({
                    type: (a.type as Attachment['type']) || 'document',
                    url: a.payload?.url || '',
                })).filter(a => a.url);

                const firstAttachment = attachments[0];
                const mediaUrl = firstAttachment?.url;
                const mediaType = firstAttachment?.type?.toUpperCase();

                const contentMap: Record<string, string> = {
                    audio: '🎤 Nota de Voz',
                    image: '📷 Imagen',
                    video: '🎥 Video',
                    document: '📄 Documento',
                    sticker: '👾 Sticker',
                };
                const content = textContent
                    || (firstAttachment ? (contentMap[firstAttachment.type] || '[Adjunto]') : '[Mensaje]');

                const sender = event.sender as { id: string };

                return {
                    channel: this.channel,
                    externalId: (msg.mid as string) || `ig-${Date.now()}`,
                    content,
                    sender: { id: sender.id, name: 'Instagram User', avatar: undefined },
                    attachments: attachments.length ? attachments : undefined,
                    metadata: { pageId, messageId: msg.mid as string, mediaUrl, mediaType },
                };
            };

            if (body.object === 'instagram') {
                for (const entry of body.entry) {
                    const pageId = entry.id as string;

                    // Structure A: entry.messaging[] (standard DM)
                    const webhookEvent = entry.messaging?.[0];
                    if (webhookEvent) {
                        const result = buildFromMessagingEvent(webhookEvent, pageId);
                        if (result) return result;
                    }

                    // Structure B: entry.changes[field='messages'] (new IG Messaging API)
                    for (const change of (entry.changes || [])) {
                        if (change.field === 'messages') {
                            const val = change.value as Record<string, unknown>;
                            // value has sender, recipient, message top-level
                            const result = buildFromMessagingEvent(val, pageId);
                            if (result) return result;
                        }
                    }
                }
            }
            return null;
        } catch (error) {
            console.error('Error parsing Instagram webhook:', error);
            return null;
        }
    }
}
