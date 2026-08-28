/**
 * Messages Router
 * Handles /api/inbox/conversations/:id/messages and /api/inbox/messages/:id
 */
import { Router, Request, Response } from "express";
import { prisma } from "@agency/database";
import { EventBus } from "@agency/events";
import { requireUserOrServiceAuth } from "@agency/service-auth";
import { markFirstResponse } from "../lib/inbox/sla";
import { auditMessageSent } from "../lib/inbox/audit";
import { linkMessageToThread, getMessageThread } from "../lib/inbox/threading";
import { logger } from "../lib/inbox/logger";

export function createMessagesRouter(eventBus: EventBus): Router {
  const router = Router();

  // Apply auth to all routes in this router
  router.use(requireUserOrServiceAuth);

  // ── GET /conversations/:id/messages ────────────────────────────────────────
  router.get("/conversations/:id/messages", async (req: Request, res: Response) => {
    try {
      let targetId = req.params.id;

      const convoByLead = await prisma.conversation.findFirst({
        where: { leadId: targetId },
        orderBy: { lastMessageAt: "desc" },
      });
      if (convoByLead) targetId = convoByLead.id;

      const { page = "1", limit = "50" } = req.query;
      const safeLimit = Math.min(parseInt(String(limit), 10) || 50, 200);
      const safePage = Math.max(parseInt(String(page), 10) || 1, 1);
      const skip = (safePage - 1) * safeLimit;

      const messages = await prisma.message.findMany({
        where: { conversationId: targetId },
        orderBy: { createdAt: "asc" },
        include: { attachments: true },
        take: safeLimit,
        skip,
      });

      res.json({ success: true, messages, page: safePage, limit: safeLimit });
    } catch (err) {
      logger.error("[messages] GET /conversations/:id/messages failed", { error: String(err) });
      res.status(500).json({ success: false, error: "Internal server error" });
    }
  });

  // ── POST /conversations/:id/messages ───────────────────────────────────────
  router.post("/conversations/:id/messages", async (req: Request, res: Response) => {
    try {
      const {
        content,
        type = "TEXT",
        direction = "OUTBOUND",
        status = "SENT",
        mediaUrl,
        mediaType,
        attachments = [],
        inReplyToHeader,
        subject,
      } = req.body;

      const senderId =
        (req.headers["x-user-id"] as string | undefined) ||
        req.body.senderId ||
        "system";

      let targetId = String(req.params.id);
      let conversation = await prisma.conversation.findUnique({ where: { id: targetId } });
      if (!conversation) {
        conversation = await prisma.conversation.findFirst({
          where: { leadId: targetId },
          orderBy: { lastMessageAt: "desc" },
        });
        if (conversation) targetId = conversation.id;
      }

      if (!conversation) {
        return res.status(404).json({ success: false, error: "Conversation not found" });
      }

      // 1. Create message in DB
      const message = await prisma.message.create({
        data: {
          conversationId: targetId,
          content: content || null,
          type,
          direction,
          senderId,
          status,
          mediaUrl: mediaUrl || (attachments.length > 0 ? attachments[0].url : null),
          mediaType: mediaType || (attachments.length > 0 ? attachments[0].type : null),
        },
      });

      // 2. Create attachments if any
      if (attachments.length > 0) {
        const attachData = attachments.map((a: any) => ({
          messageId: message.id,
          fileName: a.fileName || a.name || "Archivo",
          mediaUrl: a.mediaUrl || a.url,
          mediaType: a.mediaType || a.type || "image/jpeg",
          fileSize: a.fileSize || 0,
        }));
        await prisma.messageAttachment.createMany({ data: attachData });
      }

      // 3. Email thread linking
      if (subject || inReplyToHeader) {
        try {
          await linkMessageToThread(targetId, String(message.id), subject || "", inReplyToHeader);
        } catch (e) {
          logger.error("[messages] Thread linking failed", { error: String(e) });
        }
      }

      // 4. Update conversation
      const preview = content
        ? content.substring(0, 100)
        : attachments.length > 0
        ? "🎤 Nota de voz"
        : "...";

      await prisma.conversation.update({
        where: { id: targetId },
        data: {
          lastMessageAt: new Date(),
          lastMessagePreview: preview,
          status: "OPEN",
          unreadCount: { increment: direction === "INBOUND" ? 1 : 0 },
        },
      });

      // 5. SLA first-response tracking (outbound)
      if (direction === "OUTBOUND") {
        markFirstResponse(targetId).catch((e) =>
          logger.error("[messages] markFirstResponse failed", { error: String(e) })
        );
      }

      // 6. Audit
      if (senderId && senderId !== "system") {
        auditMessageSent(targetId, String(message.id), conversation.companyId, senderId, {
          attachmentsCount: attachments.length,
        }).catch((e) =>
          logger.error("[messages] auditMessageSent failed", { error: String(e) })
        );
      }

      // 7. Publish event (eventBus already initialised — no hoisting issue)
      await eventBus.publish("message.sent", {
        messageId: message.id,
        conversationId: targetId,
        direction,
      });

      res.status(201).json({ success: true, message });
    } catch (err) {
      logger.error("[messages] POST /conversations/:id/messages failed", { error: String(err) });
      res.status(500).json({ success: false, error: "Internal server error" });
    }
  });

  // ── PATCH /messages/:id ─────────────────────────────────────────────────────
  router.patch("/messages/:id", async (req: Request, res: Response) => {
    try {
      const messageId = String(req.params.id);
      const { status, externalId } = req.body;
      const message = await prisma.message.update({
        where: { id: messageId },
        data: {
          ...(status !== undefined && { status }),
          ...(externalId !== undefined && { externalId }),
        },
      });
      res.json({ success: true, message });
    } catch (err) {
      logger.error("[messages] PATCH /messages/:id failed", { error: String(err) });
      res.status(500).json({ success: false, error: "Internal server error" });
    }
  });

  // ── GET /messages/:id/thread ────────────────────────────────────────────────
  router.get("/messages/:id/thread", async (req: Request, res: Response) => {
    try {
      const messageId = String(req.params.id);
      const thread = await getMessageThread(messageId);
      res.json({ success: true, data: thread });
    } catch (err) {
      logger.error("[messages] GET /messages/:id/thread failed", { error: String(err) });
      res.status(500).json({ success: false, error: "Internal server error" });
    }
  });

  // ── PATCH /drafts/:id ───────────────────────────────────────────────────────
  router.patch("/drafts/:id", async (req: Request, res: Response) => {
    try {
      const draftId = String(req.params.id);
      const ALLOWED = ["content", "status"] as const;
      const data: Record<string, unknown> = {};
      for (const f of ALLOWED) {
        if (req.body[f] !== undefined) data[f] = req.body[f];
      }
      const draft = await prisma.messageDraft.update({ where: { id: draftId }, data });
      res.json({ success: true, data: draft });
    } catch (err) {
      logger.error("[messages] PATCH /drafts/:id failed", { error: String(err) });
      res.status(500).json({ success: false, error: "Internal server error" });
    }
  });

  return router;
}
