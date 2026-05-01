/**
 * lib/integrations/openclaw.ts — OpenClaw Gateway Provider
 * ─────────────────────────────────────────────────────────
 * Ciudadano de primera clase en el ChannelProviderRegistry.
 *
 * Implementa el contrato completo de ChannelProvider:
 *  - verifySignature: HMAC-SHA256 con x-openclaw-signature
 *  - validateWebhook: Handshake para verificación de endpoint
 *  - parseWebhook:    Normaliza el payload de OpenClaw → InboundMessage
 *  - sendMessage:     Envía mensajes salientes vía OpenClaw Gateway API
 */

import { createHmac, timingSafeEqual } from "crypto";
import { ChannelType, ProcessingResult } from "@/types/inbox";
import { ChannelProvider, InboundMessage, OutboundMessage } from "./types";
import { db } from "@/lib/db";

// ─────────────────────────────────────────────────────────────────────────────
// OpenClaw Normalized Payload Schema
// {
//   id:       string,          — Unique message ID (for deduplication)
//   channel:  string,          — Origin channel (WHATSAPP, TELEGRAM, etc.)
//   sender: {
//     id:     string,          — Sender platform ID
//     name:   string,          — Sender display name
//     avatar: string?,         — Avatar URL if available
//   },
//   content:  string,          — Plain text content
//   metadata: {
//     companyId?:  string,     — Target company (optional, multi-tenant)
//     mediaUrl?:   string,     — Media URL if message has attachment
//     mediaType?:  string,     — MIME type of media
//     recipientId?: string,    — The gateway-registered recipient ID
//     [key: string]: unknown,
//   }
// }
// ─────────────────────────────────────────────────────────────────────────────

export class OpenClawProvider implements ChannelProvider {
    channel: ChannelType = "OPENCLAW" as ChannelType;

    private get secret(): string {
        return process.env.OPENCLAW_WEBHOOK_SECRET ?? process.env.OPENCLAW_GATEWAY_SECRET ?? "";
    }

    private get gatewayUrl(): string {
        return process.env.OPENCLAW_GATEWAY_URL ?? "http://localhost:18789";
    }

    // ── 1. Webhook Verification (Hub Challenge Handshake) ─────────────────────
    async validateWebhook(request: Request): Promise<boolean> {
        const url = new URL(request.url);
        const token = url.searchParams.get("hub.verify_token");
        const expectedToken = process.env.OPENCLAW_VERIFY_TOKEN ?? this.secret;
        return token === expectedToken;
    }

    // ── 2. Signature Verification (HMAC-SHA256) ───────────────────────────────
    async verifySignature(request: Request): Promise<boolean> {
        const secret = this.secret;

        // If no secret configured, allow in dev but warn
        if (!secret) {
            if (process.env.NODE_ENV !== "production") {
                console.warn("[OpenClawProvider] No OPENCLAW_WEBHOOK_SECRET set — skipping signature check (dev mode).");
                return true;
            }
            console.error("[OpenClawProvider] OPENCLAW_WEBHOOK_SECRET not configured in production.");
            return false;
        }

        const signature = request.headers.get("x-openclaw-signature") ?? request.headers.get("x-openclaw-secret");
        if (!signature) {
            console.warn("[OpenClawProvider] Missing signature header.");
            return false;
        }

        // Clone request to read body without consuming it
        const cloned = request.clone();
        const rawBody = await cloned.text();

        // Support both plain secret comparison (legacy) and HMAC-SHA256
        if (signature === secret) {
            // Legacy: direct secret match (backward compat with existing openclaw route)
            return true;
        }

        // Modern: HMAC-SHA256 verification
        const expected = `sha256=${createHmac("sha256", secret).update(rawBody).digest("hex")}`;
        try {
            return timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
        } catch {
            // Buffers of different length — definitely wrong
            return false;
        }
    }

    // ── 3. Parse Incoming Webhook → Normalized InboundMessage ────────────────
    async parseWebhook(request: Request): Promise<InboundMessage | null> {
        let body: Record<string, unknown>;
        try {
            const cloned = request.clone();
            body = await cloned.json();
        } catch {
            console.error("[OpenClawProvider] Failed to parse webhook body as JSON.");
            return null;
        }

        const { id, channel, sender, content, metadata } = body as {
            id?: string;
            channel?: string;
            sender?: { id?: string; name?: string; avatar?: string };
            content?: string;
            metadata?: Record<string, unknown>;
        };

        // Validate required fields
        if (!sender?.id || !channel) {
            console.warn("[OpenClawProvider] Webhook payload missing required fields (sender.id, channel).", { id, channel, sender });
            return null;
        }

        // Map OpenClaw channel string → our ChannelType enum
        const mappedChannel = this.mapChannel(channel);

        return {
            channel: mappedChannel ?? ("OPENCLAW" as ChannelType),
            externalId: (id as string) ?? `openclaw-${Date.now()}`,
            content: (content as string) ?? "",
            sender: {
                id: sender.id,
                name: sender.name ?? `${channel} User`,
                avatar: sender.avatar,
            },
            metadata: {
                ...((metadata as Record<string, unknown>) ?? {}),
                // Propagate recipientId so multi-tenant resolution works in the universal webhook
                recipientId: metadata?.recipientId ?? metadata?.companyId,
                sourceGateway: "openclaw",
                originalChannel: channel,
            },
            attachments: metadata?.mediaUrl
                ? [{
                    url: metadata.mediaUrl as string,
                    type: this.inferAttachmentType(metadata.mediaType as string | undefined),
                    mimeType: metadata.mediaType as string | undefined,
                }]
                : undefined,
        };
    }

    // ── 4. Send Outbound Message via OpenClaw Gateway ─────────────────────────
    async sendMessage(message: OutboundMessage): Promise<ProcessingResult> {
        try {
            const conversation = await db.conversation.findUnique({
                where: { id: message.conversationId },
                include: { lead: true },
            });

            if (!conversation) {
                return { success: false, error: "Conversation not found" };
            }

            const payload = {
                target: conversation.lead?.phone ?? conversation.lead?.email ?? "unknown",
                message: message.content,
                channel: conversation.channel,
                attachments: message.attachments ?? [],
            };

            const response = await fetch(`${this.gatewayUrl}/api/v1/message/send`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-openclaw-secret": process.env.OPENCLAW_GATEWAY_SECRET ?? "",
                },
                body: JSON.stringify(payload),
                signal: AbortSignal.timeout(10_000),
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error("[OpenClawProvider] Failed to send message:", errorText);
                return { success: false, error: `Gateway error: ${response.statusText}` };
            }

            const data = await response.json() as { messageId?: string };
            return { success: true, messageId: data.messageId ?? `openclaw-${Date.now()}` };
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : String(error);
            console.error("[OpenClawProvider] Send Error:", error);
            return { success: false, error: message };
        }
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private mapChannel(channel: string): ChannelType | null {
        const map: Record<string, ChannelType> = {
            WHATSAPP: "WHATSAPP",
            TELEGRAM: "TELEGRAM" as ChannelType,
            SMS: "SMS" as ChannelType,
            EMAIL: "EMAIL" as ChannelType,
            INSTAGRAM: "INSTAGRAM",
            MESSENGER: "MESSENGER",
            FACEBOOK: "MESSENGER",
            TWITTER: "TWITTER" as ChannelType,
            LINKEDIN: "LINKEDIN" as ChannelType,
        };
        return map[channel.toUpperCase()] ?? null;
    }

    private inferAttachmentType(mimeType?: string): "image" | "video" | "audio" | "document" | "sticker" {
        if (!mimeType) return "document";
        if (mimeType.startsWith("image/")) return "image";
        if (mimeType.startsWith("video/")) return "video";
        if (mimeType.startsWith("audio/")) return "audio";
        return "document";
    }
}
