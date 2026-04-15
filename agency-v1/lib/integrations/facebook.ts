import { ChannelType, ProcessingResult } from "@/types/inbox";
import { ChannelProvider, OutboundMessage, InboundMessage } from "./types";
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

        // Dynamic Token Retrieval — cast to any: union type doesn't expose accessToken directly
        const config = await getSystemIntegrationConfig('facebook') as any;
        if (config?.accessToken) {
            tokenToUse = config.accessToken;
        }

        if (message.pageId) {
            // For advanced multi-page, we might look up a specific page token here
        }

        if (!tokenToUse) {
            return { success: false, error: "No Page Access Token available" };
        }

        try {
            const result = await MetaService.sendTextMessage(tokenToUse, message.conversationId, message.content);
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
                    // 1. Handle Messaging Events
                    const webhookEvent = entry.messaging?.[0];

                    if (webhookEvent && webhookEvent.message) {
                        const senderPsid = webhookEvent.sender.id;
                        const pageId = entry.id;

                        return {
                            channel: this.channel,
                            externalId: webhookEvent.message.mid,
                            content: webhookEvent.message.text || "[Attachment]",
                            sender: {
                                id: senderPsid,
                                name: "Facebook User",
                                avatar: undefined
                            },
                            metadata: {
                                pageId: pageId,
                                messageId: webhookEvent.message.mid
                            }
                        };
                    }

                    // 2. Handle LeadGen Events
                    if (entry.changes) {
                        for (const change of entry.changes) {
                            if (change.field === 'leadgen') {
                                const leadgenId = change.value.leadgen_id;
                                const pageId = change.value.page_id;
                                const formId = change.value.form_id;

                                console.log(`[LeadAds] New Lead detected: ${leadgenId}`);

                                return {
                                    channel: 'EMAIL', // Treat as Lead
                                    externalId: leadgenId,
                                    content: `New Lead Ad Submission: ${leadgenId}`,
                                    sender: {
                                        id: 'system',
                                        name: 'Meta Lead Ads',
                                    },
                                    metadata: {
                                        type: 'LEAD_AD',
                                        leadgenId: leadgenId,
                                        formId: formId,
                                        pageId: pageId
                                    }
                                };
                            }
                        }
                    }
                }
            }
            return null;
        } catch (error) {
            console.error("Error parsing Facebook webhook:", error);
            return null;
        }
    }
}
