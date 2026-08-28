/**
 * WhatsApp Webhook Payload Parser
 * Parses incoming Meta Business API webhook payloads into normalized InboxMessages.
 *
 * Spec: https://developers.facebook.com/docs/whatsapp/cloud-api/webhooks/payload-examples
 */

export interface WhatsAppIncomingMessage {
  /** WhatsApp message ID (wamid.xxx) */
  waMessageId: string;
  /** Sender phone number in E.164 format (e.g. "5215512345678") */
  from: string;
  /** Recipient WhatsApp Business Account phone number */
  to: string;
  /** Unix timestamp (seconds) */
  timestamp: number;
  /** Normalized message type */
  type: "TEXT" | "IMAGE" | "AUDIO" | "VIDEO" | "DOCUMENT" | "STICKER" | "LOCATION" | "UNSUPPORTED";
  /** Plain text content (null for non-text messages) */
  text: string | null;
  /** Media URL if available in the payload (usually requires a separate fetch) */
  mediaId: string | null;
  /** Media MIME type */
  mimeType: string | null;
  /** File name for document messages */
  fileName: string | null;
  /** WhatsApp Business Account ID */
  wbaId: string;
  /** Display phone number from the business profile */
  displayPhoneNumber: string;
}

export interface WhatsAppStatusUpdate {
  waMessageId: string;
  recipientPhone: string;
  /** sent | delivered | read | failed */
  status: string;
  timestamp: number;
}

export interface ParsedWhatsAppWebhook {
  messages: WhatsAppIncomingMessage[];
  statuses: WhatsAppStatusUpdate[];
}

/**
 * Maps Meta message type strings to our internal enum values
 */
function mapMessageType(metaType: string): WhatsAppIncomingMessage["type"] {
  const typeMap: Record<string, WhatsAppIncomingMessage["type"]> = {
    text: "TEXT",
    image: "IMAGE",
    audio: "AUDIO",
    video: "VIDEO",
    document: "DOCUMENT",
    sticker: "STICKER",
    location: "LOCATION",
  };
  return typeMap[metaType] ?? "UNSUPPORTED";
}

/**
 * Parses a Meta Business API webhook payload.
 * Returns normalized messages and status updates found in the payload.
 * Tolerates malformed payloads — logs and returns empty arrays rather than throwing.
 */
export function parseWhatsAppWebhook(rawBody: unknown): ParsedWhatsAppWebhook {
  const result: ParsedWhatsAppWebhook = { messages: [], statuses: [] };

  try {
    const body = rawBody as any;

    if (body?.object !== "whatsapp_business_account") {
      return result; // Not a WhatsApp webhook
    }

    const entries: any[] = body.entry ?? [];

    for (const entry of entries) {
      const changes: any[] = entry.changes ?? [];

      for (const change of changes) {
        if (change.field !== "messages") continue;

        const value = change.value ?? {};
        const wbaId: string = value.metadata?.phone_number_id ?? "";
        const displayPhoneNumber: string = value.metadata?.display_phone_number ?? "";
        const to: string = value.metadata?.display_phone_number ?? "";

        // ── Parse incoming messages ───────────────────────────────────────────
        const rawMessages: any[] = value.messages ?? [];
        for (const msg of rawMessages) {
          const type = mapMessageType(msg.type);

          let text: string | null = null;
          let mediaId: string | null = null;
          let mimeType: string | null = null;
          let fileName: string | null = null;

          if (type === "TEXT") {
            text = msg.text?.body ?? null;
          } else if (["IMAGE", "AUDIO", "VIDEO", "STICKER"].includes(type)) {
            const mediaObject = msg[msg.type] ?? {};
            mediaId = mediaObject.id ?? null;
            mimeType = mediaObject.mime_type ?? null;
          } else if (type === "DOCUMENT") {
            const doc = msg.document ?? {};
            mediaId = doc.id ?? null;
            mimeType = doc.mime_type ?? null;
            fileName = doc.filename ?? null;
            // Fallback: document caption as text
            text = doc.caption ?? null;
          }

          result.messages.push({
            waMessageId: msg.id,
            from: msg.from,
            to,
            timestamp: parseInt(msg.timestamp, 10),
            type,
            text,
            mediaId,
            mimeType,
            fileName,
            wbaId,
            displayPhoneNumber,
          });
        }

        // ── Parse delivery/read status updates ────────────────────────────────
        const rawStatuses: any[] = value.statuses ?? [];
        for (const st of rawStatuses) {
          result.statuses.push({
            waMessageId: st.id,
            recipientPhone: st.recipient_id,
            status: st.status,
            timestamp: parseInt(st.timestamp, 10),
          });
        }
      }
    }
  } catch (err) {
    // Never throw — a bad payload must not crash the service
    console.error("[whatsapp-parser] Failed to parse webhook payload", err);
  }

  return result;
}
