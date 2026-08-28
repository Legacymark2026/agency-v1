/**
 * Webhooks Router
 *
 * Fix #3: WhatsApp webhook now:
 *  1. Verifies X-Hub-Signature-256 via HMAC (prevents spoofed payloads)
 *  2. Parses the Meta Business API payload
 *  3. Upserts a Conversation (by platformId = sender phone + channel=WHATSAPP)
 *  4. Creates an INBOUND Message in DB
 *  5. Publishes message.received to EventBus
 *  6. Processes delivery/read status updates
 *
 * The GET endpoint handles the Facebook webhook verification challenge.
 * NOTE: Webhook routes do NOT use JWT auth — they use HMAC signature verification.
 */
import { Router, Request, Response } from "express";
import { prisma } from "@agency/database";
import { EventBus } from "@agency/events";
import { verifyWebhookSignature } from "../lib/inbox/webhooks";
import { parseWhatsAppWebhook } from "../lib/inbox/whatsapp-parser";
import { logger } from "../lib/inbox/logger";

export function createWebhooksRouter(eventBus: EventBus): Router {
  const router = Router();

  // ── GET /whatsapp — Facebook webhook challenge verification ─────────────────
  router.get("/whatsapp", (req: Request, res: Response) => {
    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];

    const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN;

    if (!verifyToken) {
      logger.error("[webhook/whatsapp] WHATSAPP_VERIFY_TOKEN env var is not set");
      return res.status(500).send("Server misconfiguration");
    }

    if (mode === "subscribe" && token === verifyToken) {
      logger.info("[webhook/whatsapp] Verification challenge accepted");
      return res.status(200).send(challenge);
    }

    logger.warn("[webhook/whatsapp] Verification challenge rejected", { mode, token });
    return res.status(403).send("Forbidden");
  });

  // ── POST /whatsapp — Incoming messages from Meta ────────────────────────────
  router.post("/whatsapp", async (req: Request, res: Response) => {
    // FIX #3a: Verify HMAC signature BEFORE processing payload
    const appSecret = process.env.WHATSAPP_APP_SECRET;
    if (!appSecret) {
      logger.error("[webhook/whatsapp] WHATSAPP_APP_SECRET env var is not set");
      return res.status(500).json({ error: "Server misconfiguration" });
    }

    const signatureHeader = req.headers["x-hub-signature-256"] as string | undefined;
    if (!signatureHeader) {
      logger.warn("[webhook/whatsapp] Missing X-Hub-Signature-256 header");
      return res.status(401).json({ error: "Missing webhook signature" });
    }

    // The signature header format is "sha256=<hex>"
    const receivedSignature = signatureHeader.replace(/^sha256=/, "");
    const rawBody = JSON.stringify(req.body);

    const isValid = verifyWebhookSignature(rawBody, receivedSignature, appSecret);
    if (!isValid) {
      logger.warn("[webhook/whatsapp] Invalid HMAC signature — rejecting payload");
      return res.status(401).json({ error: "Invalid webhook signature" });
    }

    // FIX #3b: Respond 200 immediately (Meta requires response within 20s)
    // Process the payload asynchronously to avoid timeouts on heavy batches
    res.status(200).json({ status: "ok" });

    // Async processing — errors here don't affect the 200 response
    setImmediate(() => processWhatsAppPayload(req.body, eventBus).catch((err) => {
      logger.error("[webhook/whatsapp] Async processing failed", { error: String(err) });
    }));
  });

  return router;
}

/**
 * Core processing logic for a verified WhatsApp webhook payload.
 * Runs asynchronously after the 200 response is sent.
 */
async function processWhatsAppPayload(rawBody: unknown, eventBus: EventBus): Promise<void> {
  const parsed = parseWhatsAppWebhook(rawBody);

  // ── Process incoming messages ──────────────────────────────────────────────
  for (const msg of parsed.messages) {
    try {
      // Find the company that owns this WhatsApp Business Account phone number
      // The WABA display_phone_number is stored as platformId on the company or
      // as a config entry. We try to find an existing conversation first.
      const existingConvo = await prisma.conversation.findFirst({
        where: {
          platformId: msg.from,
          channel: "WHATSAPP",
        },
        orderBy: { lastMessageAt: "desc" },
      });

      let companyId: string | undefined;
      let conversationId: string;

      if (existingConvo) {
        // Resume existing conversation
        companyId = existingConvo.companyId;
        conversationId = existingConvo.id;

        if (existingConvo.status === "CLOSED" || existingConvo.status === "ARCHIVED") {
          await prisma.conversation.update({
            where: { id: conversationId },
            data: {
              status: "OPEN",
              lastMessageAt: new Date(),
              lastMessagePreview: msg.text ?? `[${msg.type}]`,
            },
          });
        }
      } else {
        // Create a new conversation for this WhatsApp sender
        const company = await prisma.company.findFirst({ select: { id: true } });
        if (!company) {
          logger.error("[webhook/whatsapp] No company found — cannot create conversation", { from: msg.from });
          continue;
        }
        companyId = company.id;

        const newConvo = await prisma.conversation.create({
          data: {
            companyId,
            contactName: msg.from, // Will be enriched when lead is matched
            channel: "WHATSAPP",
            platformId: msg.from,
            status: "OPEN",
            lastMessageAt: new Date(),
            lastMessagePreview: msg.text ?? `[${msg.type}]`,
          },
        });
        conversationId = newConvo.id;
        logger.info("[webhook/whatsapp] New conversation created", { conversationId, from: msg.from });
      }

      // Persist the inbound message
      const message = await prisma.message.create({
        data: {
          conversationId,
          content: msg.text,
          type: msg.type,
          direction: "INBOUND",
          externalId: msg.waMessageId,
          senderId: msg.from,
          status: "RECEIVED",
          mediaType: msg.mimeType,
        },
      });

      // Update conversation preview + unread count
      await prisma.conversation.update({
        where: { id: conversationId },
        data: {
          lastMessageAt: new Date(msg.timestamp * 1000),
          lastMessagePreview: msg.text ?? `[${msg.type}]`,
          unreadCount: { increment: 1 },
        },
      });

      // Publish event for downstream services (AI engine, notifications, etc.)
      await eventBus.publish("message.received", {
        messageId: message.id,
        conversationId,
        companyId,
        channel: "WHATSAPP",
        from: msg.from,
        type: msg.type,
        timestamp: msg.timestamp,
      });

      logger.info("[webhook/whatsapp] Message processed", {
        waMessageId: msg.waMessageId,
        conversationId,
        type: msg.type,
      });
    } catch (err) {
      logger.error("[webhook/whatsapp] Failed to process message", {
        waMessageId: msg.waMessageId,
        from: msg.from,
        error: String(err),
      });
      // Continue processing remaining messages in the batch
    }
  }

  // ── Process status updates (sent → delivered → read) ───────────────────────
  for (const status of parsed.statuses) {
    try {
      await prisma.message.updateMany({
        where: { externalId: status.waMessageId },
        data: { status: status.status.toUpperCase() },
      });

      logger.info("[webhook/whatsapp] Status update applied", {
        waMessageId: status.waMessageId,
        status: status.status,
      });
    } catch (err) {
      logger.error("[webhook/whatsapp] Failed to apply status update", {
        waMessageId: status.waMessageId,
        error: String(err),
      });
    }
  }
}
