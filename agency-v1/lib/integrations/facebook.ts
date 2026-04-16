import { ChannelType, ProcessingResult } from "@/types/inbox";
import { ChannelProvider, OutboundMessage, InboundMessage, Attachment } from "./types";
import { MetaService } from "@/lib/meta-service";
import crypto from "crypto";
import { getSystemIntegrationConfig } from "@/lib/integration-config-service";
import { IntegrationConfigData } from "@/actions/integration-config";

export class FacebookProvider implements ChannelProvider {
    channel: ChannelType;
    private pageAccessToken: string;

    constructor(channel: ChannelType = 'MESSENGER', token: string = '') {
        this.channel = channel;
        this.pageAccessToken = token;
    }

    async sendMessage(message: OutboundMessage): Promise<ProcessingResult> {
        console.log(`[FacebookProvider] Sending message to ${message.conversationId}`);

        // Prioritize the pageId from the message context if available
        let tokenToUse = this.pageAccessToken;

        // Dynamic Token Retrieval
        const config = await getSystemIntegrationConfig('facebook') as any;
        if (config?.accessToken) {
            tokenToUse = config.accessToken;
        }

        if (!tokenToUse) {
            return { success: false, error: "No Page Access Token available" };
        }

        try {
            let result;
            if (message.attachments && message.attachments.length > 0) {
                const attachment = message.attachments[0];
                const typeMap: Record<string, 'audio' | 'image' | 'video' | 'file'> = {
                    audio: 'audio',
                    image: 'image',
                    video: 'video',
                    document: 'file',
                    sticker: 'image'
                };
                const type = typeMap[attachment.type] || 'file';
                result = await MetaService.sendMediaMessage(tokenToUse, message.conversationId, type, attachment.url);
            } else {
                result = await MetaService.sendTextMessage(tokenToUse, message.conversationId, message.content);
            }
            
            return { success: true, messageId: result.message_id };
        } catch (error: any) /* eslint-disable-line @typescript-eslint/no-explicit-any */ {
            console.error("Facebook Send Error:", error);
            return { success: false, error: error.message };
        }
    }

    async verifySignature(request: Request): Promise<boolean> {
        const signature = request.headers.get("x-hub-signature-256");
        let appSecret = process.env.META_APP_SECRET || process.env.FACEBOOK_CLIENT_SECRET;

        // Try getting from DB — cast to any: union type doesn't expose appSecret directly
        const config = await getSystemIntegrationConfig('facebook') as any;
        if (config?.appSecret) {
            appSecret = config.appSecret;
        }

        // In dev mode, if no secret is set, we might want to bypass or warn.
        // For "ultra-professional" mode, we enforce it if the header is present.
        if (!appSecret) {
            console.warn("[FacebookProvider] META_APP_SECRET not set in ENV or DB. Skipping verification (UNSAFE).");
            return true;
        }

        if (!signature) {
            console.warn("[FacebookProvider] No signature header found.");
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
            console.error("[FacebookProvider] Signature verification failed:", error);
            return false;
        }
    }

    async validateWebhook(request: Request): Promise<boolean> {
        const url = new URL(request.url);
        const mode = url.searchParams.get("hub.mode");
        const token = url.searchParams.get("hub.verify_token");

        let verifyToken = process.env.META_WEBHOOK_VERIFY_TOKEN || process.env.FACEBOOK_WEBHOOK_VERIFY_TOKEN;
        const config = await getSystemIntegrationConfig('facebook') as any;
        if (config?.verifyToken) {
            verifyToken = config.verifyToken;
        }

        if (mode === "subscribe" && token === verifyToken) {
            return true;
        }
        return false;
    }

    async parseWebhook(request: Request): Promise<InboundMessage | null> {
        try {
            const body = await request.json();

            if (body.object === 'page') {
                for (const entry of body.entry) {
                    // ── 1. Messaging Events (Messenger DMs) ──────────────────
                    const webhookEvent = entry.messaging?.[0];

                    if (webhookEvent && webhookEvent.message) {
                        const msg = webhookEvent.message as Record<string, unknown>;
                        if (msg.is_echo) continue; // skip own echoes

                        const senderPsid = webhookEvent.sender.id as string;
                        const pageId = entry.id as string;

                        // Extract text
                        const textContent = (msg.text as string) || '';

                        // Extract attachments (audio, image, video, document, sticker)
                        const rawAttachments = (msg.attachments as Array<{ type: string; payload: { url?: string; sticker_id?: number } }>) || [];
                        const attachments: Attachment[] = rawAttachments.map(a => ({
                            type: (a.type as Attachment['type']) || 'document',
                            url: a.payload?.url || '',
                        })).filter(a => a.url);

                        // Derive primary media info for quick access
                        const firstAttachment = attachments[0];
                        const mediaUrl = firstAttachment?.url;
                        const mediaType = firstAttachment?.type?.toUpperCase();

                        // Human-readable content fallback
                        const contentMap: Record<string, string> = {
                            audio: '🎤 Nota de Voz',
                            image: '📷 Imagen',
                            video: '🎥 Video',
                            document: '📄 Documento',
                            sticker: '👾 Sticker',
                        };
                        const content = textContent
                            || (firstAttachment ? (contentMap[firstAttachment.type] || '[Adjunto]') : '[Mensaje]');

                        return {
                            channel: this.channel,
                            externalId: (msg.mid as string) || `fb-${Date.now()}`,
                            content,
                            sender: {
                                id: senderPsid,
                                name: 'Facebook User',
                                avatar: undefined,
                            },
                            attachments: attachments.length ? attachments : undefined,
                            metadata: {
                                pageId,
                                messageId: msg.mid as string,
                                mediaUrl,
                                mediaType,
                            },
                        };
                    }

                    // ── 2. LeadGen Events ────────────────────────────────────
                    if (entry.changes) {
                        for (const change of entry.changes) {
                            if (change.field === 'leadgen') {
                                const leadgenId = change.value.leadgen_id;
                                const pageId = change.value.page_id;
                                const formId = change.value.form_id;

                                console.log(`[LeadAds] New Lead detected: ${leadgenId}`);

                                return {
                                    channel: 'EMAIL',
                                    externalId: leadgenId,
                                    content: `New Lead Ad Submission: ${leadgenId}`,
                                    sender: { id: 'system', name: 'Meta Lead Ads' },
                                    metadata: {
                                        type: 'LEAD_AD',
                                        leadgenId,
                                        formId,
                                        pageId,
                                    },
                                };
                            }
                        }
                    }
                }
            }
            return null;
        } catch (error) {
            console.error('Error parsing Facebook webhook:', error);
            return null;
        }
    }
}
