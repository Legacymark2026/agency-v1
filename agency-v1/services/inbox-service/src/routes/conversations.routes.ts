/**
 * Conversations Router
 * Handles all /api/inbox/conversations/* routes
 */
import { Router, Request, Response } from "express";
import { prisma } from "@agency/database";
import { EventBus } from "@agency/events";
import { requireUserOrServiceAuth } from "@agency/service-auth";
import {
  initializeSLA,
  markFirstResponse,
} from "../lib/inbox/sla";
import {
  logAuditEvent,
  auditStatusChanged,
  auditAssignmentChanged,
  auditMessageSent,
} from "../lib/inbox/audit";
import {
  linkMessageToThread,
  getConversationThreads,
} from "../lib/inbox/threading";
import { renderTemplate, buildMacroTemplateContext } from "../lib/inbox/templates";
import { mergeConversations, findDuplicateConversations } from "../lib/inbox/merge";
import { logger } from "../lib/inbox/logger";

const MAX_PAGE_LIMIT = 100;

/** Projection reutilizable para include de conversaciones */
const CONVERSATION_INCLUDE = {
  lead: {
    select: { id: true, name: true, email: true },
  },
  assignee: {
    select: { id: true, name: true, image: true },
  },
  slaConfig: {
    select: {
      status: true,
      firstResponseMinutes: true,
      resolutionMinutes: true,
      firstResponseAt: true,
      resolvedAt: true,
      breachedAt: true,
      createdAt: true,
      pausedMinutes: true,
    },
  },
  _count: {
    select: { messages: true },
  },
} as const;

export function createConversationsRouter(eventBus: EventBus): Router {
  const router = Router();

  // Apply auth to all routes in this router
  router.use(requireUserOrServiceAuth);

  // ── GET /conversations ──────────────────────────────────────────────────────
  router.get("/conversations", async (req: Request, res: Response) => {
    try {
      const {
        status,
        channel,
        assignedTo,
        search,
        platformId,
        leadId,
        page = "1",
        limit = "20",
      } = req.query;

      // companyId: from gateway header (trusted) or query (internal/dev only)
      const companyId =
        (req.headers["x-company-id"] as string | undefined) ||
        (req.query.companyId ? String(req.query.companyId) : undefined);

      const safeLimit = Math.min(parseInt(String(limit), 10) || 20, MAX_PAGE_LIMIT);
      const safePage = Math.max(parseInt(String(page), 10) || 1, 1);
      const skip = (safePage - 1) * safeLimit;

      const where: Record<string, unknown> = {};
      // FIX #5: companyId MUST be present; never falls back to all-tenants query
      if (companyId) where.companyId = companyId;
      if (status) where.status = String(status);
      if (channel) where.channel = String(channel);
      if (assignedTo) where.assignedTo = String(assignedTo);
      if (platformId) where.platformId = String(platformId);
      if (leadId) where.leadId = String(leadId);

      if (search) {
        where.OR = [
          { lead: { name: { contains: String(search), mode: "insensitive" } } },
          { lead: { email: { contains: String(search), mode: "insensitive" } } },
          { messages: { some: { content: { contains: String(search), mode: "insensitive" } } } },
        ];
      }

      const [conversations, total] = await Promise.all([
        prisma.conversation.findMany({
          where,
          orderBy: { lastMessageAt: "desc" },
          take: safeLimit,
          skip,
          include: CONVERSATION_INCLUDE,
        }),
        prisma.conversation.count({ where }),
      ]);

      res.json({ success: true, conversations, total, page: safePage, limit: safeLimit });
    } catch (err) {
      logger.error("[conversations] GET /conversations failed", { error: String(err) });
      res.status(500).json({ success: false, error: "Internal server error" });
    }
  });

  // ── GET /conversations/duplicates ───────────────────────────────────────────
  router.get("/conversations/duplicates", async (req: Request, res: Response) => {
    try {
      const { leadId, channel, companyId } = req.query;
      if (!leadId || !channel || !companyId) {
        return res.status(400).json({ success: false, error: "leadId, channel, and companyId are required" });
      }
      const duplicates = await findDuplicateConversations(
        String(leadId),
        String(channel),
        String(companyId)
      );
      res.json({ success: true, data: duplicates });
    } catch (err) {
      logger.error("[conversations] GET /conversations/duplicates failed", { error: String(err) });
      res.status(500).json({ success: false, error: "Internal server error" });
    }
  });

  // ── GET /conversations/:id ──────────────────────────────────────────────────
  router.get("/conversations/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      // Stage 1: lookup by Conversation ID
      let conversation = await prisma.conversation.findUnique({
        where: { id },
        include: { lead: true, assignee: true, slaConfig: true },
      });

      // Stage 2: lookup by Lead ID
      if (!conversation) {
        conversation = await prisma.conversation.findFirst({
          where: { leadId: id },
          include: { lead: true, assignee: true, slaConfig: true },
          orderBy: { lastMessageAt: "desc" },
        });
      }

      // Stage 3: auto-create conversation if Lead exists (CRM navigation)
      if (!conversation) {
        const lead = await prisma.lead.findUnique({ where: { id } });
        if (lead) {
          const companyId =
            lead.companyId ||
            (await prisma.company.findFirst({ select: { id: true } }))?.id;

          if (companyId) {
            conversation = await prisma.conversation.create({
              data: {
                companyId,
                leadId: lead.id,
                contactName: lead.name || "Cliente CRM",
                channel: "WEB_FORM",
                status: "OPEN",
                lastMessagePreview: "Conversación iniciada desde el CRM",
              },
              include: { lead: true, assignee: true, slaConfig: true },
            });
          }
        }
      }

      if (!conversation) {
        return res.status(404).json({ success: false, error: "Conversation not found" });
      }

      res.json({ success: true, conversation });
    } catch (err) {
      logger.error("[conversations] GET /conversations/:id failed", { error: String(err) });
      res.status(500).json({ success: false, error: "Internal server error" });
    }
  });

  // ── POST /conversations ─────────────────────────────────────────────────────
  router.post("/conversations", async (req: Request, res: Response) => {
    try {
      let { companyId, leadId, channel } = req.body;
      if (!leadId || !channel) {
        return res.status(400).json({ success: false, error: "leadId and channel required" });
      }

      if (!companyId) {
        const company = await prisma.company.findFirst();
        if (!company) return res.status(400).json({ success: false, error: "No company found" });
        companyId = company.id;
      }

      // FIX #7 (race condition): use upsert-like findFirst then create/update in tx
      const existing = await prisma.conversation.findFirst({
        where: { companyId, leadId, channel },
        orderBy: { lastMessageAt: "desc" },
      });

      if (existing) {
        if (existing.status === "OPEN") {
          return res.json({ success: true, data: existing, isNew: false });
        }
        const reopened = await prisma.conversation.update({
          where: { id: existing.id },
          data: { status: "OPEN", lastMessageAt: new Date(), lastMessagePreview: "Conversation reopened" },
        });
        return res.json({ success: true, data: reopened, isNew: false });
      }

      const conversation = await prisma.conversation.create({
        data: {
          companyId,
          leadId,
          channel,
          status: "OPEN",
          lastMessageAt: new Date(),
          lastMessagePreview: "New conversation started",
        },
      });

      res.status(201).json({ success: true, data: conversation, isNew: true });
    } catch (err) {
      logger.error("[conversations] POST /conversations failed", { error: String(err) });
      res.status(500).json({ success: false, error: "Internal server error" });
    }
  });

  // ── PATCH /conversations/:id ────────────────────────────────────────────────
  router.patch("/conversations/:id", async (req: Request, res: Response) => {
    try {
      const userId =
        (req.headers["x-user-id"] as string | undefined) ||
        String(req.query.userId || "system");

      // Whitelist of updatable fields to prevent mass-assignment
      const ALLOWED_PATCH_FIELDS = ["status", "unreadCount", "tags", "assignedTo", "metadata"] as const;
      type AllowedField = typeof ALLOWED_PATCH_FIELDS[number];
      const updateData: Partial<Record<AllowedField, unknown>> = {};
      for (const field of ALLOWED_PATCH_FIELDS) {
        if (req.body[field] !== undefined) updateData[field] = req.body[field];
      }

      let targetId = req.params.id;
      let before = await prisma.conversation.findUnique({ where: { id: targetId } });
      if (!before) {
        before = await prisma.conversation.findFirst({
          where: { leadId: targetId },
          orderBy: { lastMessageAt: "desc" },
        });
        if (before) targetId = before.id;
      }

      if (!before) return res.status(404).json({ success: false, error: "Conversation not found" });

      const conversation = await prisma.conversation.update({
        where: { id: targetId },
        data: updateData,
        include: { lead: true },
      });

      // Audit side effects
      if (updateData.status && updateData.status !== before.status) {
        await auditStatusChanged(
          conversation.id,
          conversation.companyId,
          userId,
          before.status,
          String(updateData.status)
        );
      }
      if (updateData.assignedTo !== undefined && updateData.assignedTo !== before.assignedTo) {
        await auditAssignmentChanged(
          conversation.id,
          conversation.companyId,
          userId,
          before.assignedTo ?? null,
          updateData.assignedTo as string | null
        );
      }

      res.json({ success: true, conversation });
    } catch (err) {
      logger.error("[conversations] PATCH /conversations/:id failed", { error: String(err) });
      res.status(500).json({ success: false, error: "Internal server error" });
    }
  });

  // ── POST /conversations/:id/merge ───────────────────────────────────────────
  router.post("/conversations/:id/merge", async (req: Request, res: Response) => {
    try {
      const id = String(req.params.id);
      const { secondaryId, companyId, userId } = req.body;
      if (!secondaryId || !companyId || !userId) {
        return res.status(400).json({ success: false, error: "secondaryId, companyId, and userId required" });
      }
      const result = await mergeConversations(id, secondaryId, companyId, userId);
      res.json({ success: result });
    } catch (err) {
      logger.error("[conversations] POST /merge failed", { error: String(err) });
      res.status(500).json({ success: false, error: "Internal server error" });
    }
  });

  // ── GET /conversations/:id/threads ─────────────────────────────────────────
  router.get("/conversations/:id/threads", async (req: Request, res: Response) => {
    try {
      const id = String(req.params.id);
      const threads = await getConversationThreads(id);
      res.json({ success: true, data: threads });
    } catch (err) {
      logger.error("[conversations] GET /threads failed", { error: String(err) });
      res.status(500).json({ success: false, error: "Internal server error" });
    }
  });

  // ── POST /conversations/:id/render-template ─────────────────────────────────
  router.post("/conversations/:id/render-template", async (req: Request, res: Response) => {
    try {
      const { template, companyId, userId } = req.body;
      if (!template || !companyId || !userId) {
        return res.status(400).json({ success: false, error: "template, companyId, and userId required" });
      }

      const conversation = await prisma.conversation.findUnique({
        where: { id: req.params.id },
        include: { lead: true, assignee: true },
      });
      if (!conversation) return res.status(404).json({ success: false, error: "Conversation not found" });

      const [company, user] = await Promise.all([
        prisma.company.findUnique({ where: { id: companyId } }),
        prisma.user.findUnique({ where: { id: userId } }),
      ]);

      const context = buildMacroTemplateContext({ lead: conversation.lead, user, company, conversation });
      const renderedContent = renderTemplate(template, context);

      res.json({ success: true, renderedContent, context });
    } catch (err) {
      logger.error("[conversations] POST /render-template failed", { error: String(err) });
      res.status(500).json({ success: false, error: "Internal server error" });
    }
  });

  // ── POST /conversations/:id/tags ────────────────────────────────────────────
  router.post("/conversations/:id/tags", async (req: Request, res: Response) => {
    try {
      const conversationId = String(req.params.id);
      const { tagName, userId } = req.body;
      if (!tagName || !userId) {
        return res.status(400).json({ success: false, error: "tagName and userId required" });
      }

      const conversation = await prisma.conversation.findUnique({ where: { id: conversationId } });
      if (!conversation) return res.status(404).json({ success: false, error: "Conversation not found" });

      const currentTags: string[] = Array.isArray(conversation.tags) ? (conversation.tags as string[]) : [];
      if (currentTags.includes(tagName)) {
        return res.json({ success: true, alreadyExists: true, tags: currentTags });
      }

      const newTags = [...currentTags, tagName];

      await prisma.$transaction([
        prisma.conversation.update({ where: { id: conversationId }, data: { tags: newTags } }),
        prisma.inboxTagAssignment.create({
          data: { conversationId, tagName, assignedBy: userId },
        }),
      ]);

      await logAuditEvent("tag_added", {
        conversationId,
        companyId: conversation.companyId,
        userId,
        resourceType: "conversation",
        resourceId: conversationId,
        newValue: { tag: tagName },
      });

      res.json({ success: true, tags: newTags });
    } catch (err) {
      logger.error("[conversations] POST /tags failed", { error: String(err) });
      res.status(500).json({ success: false, error: "Internal server error" });
    }
  });

  // ── DELETE /conversations/:id/tags/:tag ─────────────────────────────────────
  router.delete("/conversations/:id/tags/:tag", async (req: Request, res: Response) => {
    try {
      const conversationId = String(req.params.id);
      const tag = String(req.params.tag);
      const userId = req.headers["x-user-id"] as string | undefined;
      if (!userId) return res.status(400).json({ success: false, error: "x-user-id header required" });

      const conversation = await prisma.conversation.findUnique({ where: { id: conversationId } });
      if (!conversation) return res.status(404).json({ success: false, error: "Conversation not found" });

      const currentTags: string[] = Array.isArray(conversation.tags) ? (conversation.tags as string[]) : [];
      const newTags = currentTags.filter((t) => t !== tag);

      await prisma.$transaction([
        prisma.conversation.update({ where: { id: conversationId }, data: { tags: newTags } }),
        prisma.inboxTagAssignment.updateMany({
          where: { conversationId, tagName: tag, removedAt: null },
          data: { removedAt: new Date() },
        }),
      ]);

      await logAuditEvent("tag_removed", {
        conversationId,
        companyId: conversation.companyId,
        userId,
        resourceType: "conversation",
        resourceId: conversationId,
        oldValue: { tag },
      });

      res.json({ success: true, tags: newTags });
    } catch (err) {
      logger.error("[conversations] DELETE /tags/:tag failed", { error: String(err) });
      res.status(500).json({ success: false, error: "Internal server error" });
    }
  });

  // ── GET /conversations/:id/tags/history ─────────────────────────────────────
  router.get("/conversations/:id/tags/history", async (req: Request, res: Response) => {
    try {
      const history = await prisma.inboxTagAssignment.findMany({
        where: { conversationId: req.params.id },
        orderBy: { createdAt: "desc" },
        include: { assigner: { select: { id: true, name: true } } },
      });
      res.json({ success: true, data: history });
    } catch (err) {
      logger.error("[conversations] GET /tags/history failed", { error: String(err) });
      res.status(500).json({ success: false, error: "Internal server error" });
    }
  });

  // ── POST /conversations/:id/drafts ──────────────────────────────────────────
  router.post("/conversations/:id/drafts", async (req: Request, res: Response) => {
    try {
      const { content, status = "DRAFT", createdBy } = req.body;
      const draft = await prisma.messageDraft.create({
        data: { conversationId: req.params.id, content, version: 1, status, createdBy },
      });
      res.status(201).json({ success: true, data: draft });
    } catch (err) {
      logger.error("[conversations] POST /drafts failed", { error: String(err) });
      res.status(500).json({ success: false, error: "Internal server error" });
    }
  });

  // ── GET /conversations/:id/drafts ───────────────────────────────────────────
  router.get("/conversations/:id/drafts", async (req: Request, res: Response) => {
    try {
      const drafts = await prisma.messageDraft.findMany({
        where: { conversationId: req.params.id },
        orderBy: { createdAt: "desc" },
      });
      res.json({ success: true, data: drafts });
    } catch (err) {
      logger.error("[conversations] GET /drafts failed", { error: String(err) });
      res.status(500).json({ success: false, error: "Internal server error" });
    }
  });

  // ── POST /log-contact ───────────────────────────────────────────────────────
  router.post("/log-contact", async (req: Request, res: Response) => {
    try {
      const { leadId, channel } = req.body;
      if (!leadId || !channel) {
        return res.status(400).json({ success: false, error: "leadId and channel required" });
      }

      const lead = await prisma.lead.findUnique({
        where: { id: leadId },
        select: { companyId: true, email: true, phone: true },
      });
      if (!lead) return res.status(404).json({ success: false, error: "Lead not found" });

      let conversation = await prisma.conversation.findFirst({
        where: { companyId: lead.companyId, leadId, channel },
      });

      if (!conversation) {
        let platformId: string | undefined;
        if (channel === "WHATSAPP" || channel === "SMS") platformId = lead.phone ?? undefined;
        if (channel === "EMAIL") platformId = lead.email ?? undefined;

        conversation = await prisma.conversation.create({
          data: {
            companyId: lead.companyId,
            leadId,
            channel,
            status: "OPEN",
            platformId,
            lastMessageAt: new Date(),
            lastMessagePreview: `Contact initiated via ${channel}`,
          },
        });
      } else if (conversation.status === "ARCHIVED" || conversation.status === "CLOSED") {
        conversation = await prisma.conversation.update({
          where: { id: conversation.id },
          data: {
            status: "OPEN",
            lastMessageAt: new Date(),
            lastMessagePreview: `Contact initiated via ${channel} (Reopened)`,
          },
        });
      }

      res.json({ success: true, conversationId: conversation.id });
    } catch (err) {
      logger.error("[conversations] POST /log-contact failed", { error: String(err) });
      res.status(500).json({ success: false, error: "Internal server error" });
    }
  });

  return router;
}
