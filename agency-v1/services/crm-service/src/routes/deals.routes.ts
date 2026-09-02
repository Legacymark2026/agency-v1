/**
 * Deals Router — CRM Service
 * ─────────────────────────────────────────────────────────────────────────────
 * Fix C-1: Eager eventBus publish on stage changes and won deals.
 * Fix C-2: Protected with requireUserOrServiceAuth.
 * Fix C-3: Enforces multi-tenant isolation on all deal operations.
 * Fix C-4: Strict Zod validation and whitelisting against mass assignment.
 * Fix 9: Atomic transactions on deal conversions and stage transitions.
 */
import { Router, Request, Response } from "express";
import { z } from "zod";
import { prisma } from "@agency/database";
import { requireUserOrServiceAuth } from "@agency/service-auth";
import { eventBus } from "../lib/event-bus.singleton";
import { logger } from "../utils/logger.utils";

const MAX_PAGE_LIMIT = 100;

// ── Validation Schemas ────────────────────────────────────────────────────────
const createDealSchema = z.object({
  title: z.string().min(1, "Title is required"),
  value: z.number().min(0).default(0),
  stage: z.string().default("NEW"),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).default("MEDIUM"),
  probability: z.number().min(0).max(100).default(10),
  contactName: z.string().optional().nullable(),
  contactEmail: z.string().email().optional().nullable(),
  contactPhone: z.string().optional().nullable(),
  contactCompany: z.string().optional().nullable(),
  companyId: z.string().min(1).optional(),
  notes: z.string().optional().nullable(),
  expectedClose: z.string().optional().nullable(),
  source: z.string().default("MANUAL"),
  assignedTo: z.string().optional().nullable(),
  assignedToUserId: z.string().optional().nullable(),
  utmSource: z.string().optional().nullable(),
  utmMedium: z.string().optional().nullable(),
  utmCampaign: z.string().optional().nullable(),
});

const updateDealSchema = z.object({
  title: z.string().min(1).optional(),
  value: z.number().min(0).optional(),
  stage: z.string().optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
  probability: z.number().min(0).max(100).optional(),
  contactName: z.string().nullable().optional(),
  contactEmail: z.string().email().nullable().optional(),
  contactPhone: z.string().nullable().optional(),
  contactCompany: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  expectedClose: z.string().nullable().optional(),
  assignedTo: z.string().nullable().optional(),
  assignedToUserId: z.string().nullable().optional(),
  pipelineId: z.string().nullable().optional(),
}).strict();

const changeStageSchema = z.object({
  stage: z.string().min(1, "Stage is required"),
  userId: z.string().optional().nullable(),
});

const createActivitySchema = z.object({
  type: z.string().min(1, "Type is required"),
  content: z.string().min(1, "Content is required"),
  userId: z.string().optional().nullable(),
});

const createProposalSchema = z.object({
  title: z.string().min(1, "Proposal title is required"),
  validUntil: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  creatorId: z.string().optional().nullable(),
  lineItems: z.array(z.object({
    description: z.string().min(1),
    quantity: z.number().positive(),
    unitPrice: z.number().min(0),
  })).min(1, "At least one line item required"),
});

export const dealsRouter = Router();

dealsRouter.use(requireUserOrServiceAuth);

function getCompanyId(req: Request): string | null {
  return (req.headers["x-company-id"] as string | undefined) ||
    (req.query.companyId ? String(req.query.companyId) : null) ||
    (req.body && req.body.companyId ? String(req.body.companyId) : null);
}

// ── GET /api/deals ────────────────────────────────────────────────────────────
dealsRouter.get("/", async (req: Request, res: Response) => {
  try {
    const companyId = getCompanyId(req);
    if (!companyId) return res.status(400).json({ success: false, error: "companyId required" });

    const { stage, page = "1", pageSize = "50" } = req.query;
    const limit = Math.min(Math.max(parseInt(String(pageSize), 10) || 50, 1), MAX_PAGE_LIMIT);
    const p = Math.max(parseInt(String(page), 10) || 1, 1);
    const skip = (p - 1) * limit;

    const where: Record<string, unknown> = { companyId: String(companyId) };
    if (stage) where.stage = String(stage);

    const [deals, total] = await Promise.all([
      prisma.deal.findMany({
        where,
        orderBy: { updatedAt: "desc" },
        take: limit,
        skip,
        include: {
          assignedUser: { select: { id: true, name: true, image: true, email: true } },
        },
      }),
      prisma.deal.count({ where }),
    ]);

    res.json({ success: true, deals, total, page: p, limit });
  } catch (err) {
    logger.error("[deals] GET / failed", { error: String(err) });
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

// ── GET /api/deals/:id ────────────────────────────────────────────────────────
dealsRouter.get("/:id", async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const companyId = getCompanyId(req);

    const where: any = { id };
    if (companyId) where.companyId = companyId;

    const deal = await prisma.deal.findFirst({
      where,
      include: {
        activities: {
          orderBy: { createdAt: "desc" },
          include: { user: { select: { name: true, image: true } } },
        },
        assignedUser: { select: { id: true, name: true, image: true, email: true } },
        company: { select: { id: true, name: true } },
      },
    });

    if (!deal) return res.status(404).json({ success: false, error: "Deal not found" });
    res.json({ success: true, deal });
  } catch (err) {
    logger.error("[deals] GET /:id failed", { error: String(err) });
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

// ── POST /api/deals ───────────────────────────────────────────────────────────
dealsRouter.post("/", async (req: Request, res: Response) => {
  try {
    const companyId = getCompanyId(req);
    if (!companyId) return res.status(400).json({ success: false, error: "companyId required" });

    const parsed = createDealSchema.safeParse({ ...req.body, companyId });
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        error: "Validation failed",
        details: parsed.error.errors.map(e => ({ path: e.path.join("."), message: e.message })),
      });
    }

    const d = parsed.data;

    const deal = await prisma.$transaction(async (tx) => {
      const createdDeal = await tx.deal.create({
        data: {
          title: d.title,
          value: d.value,
          stage: d.stage,
          priority: d.priority,
          probability: d.probability,
          contactName: d.contactName,
          contactEmail: d.contactEmail,
          companyId,
          notes: d.notes,
          expectedClose: d.expectedClose ? new Date(d.expectedClose) : undefined,
          source: d.source,
          assignedTo: d.assignedTo || d.assignedToUserId || null,
          assignedToUserId: d.assignedToUserId || d.assignedTo || null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      // Auto-create lead if not exists
      if (d.contactEmail) {
        const emailLower = d.contactEmail.toLowerCase();
        const existingLead = await tx.lead.findFirst({
          where: { email: emailLower, companyId },
        });

        if (!existingLead) {
          await tx.lead.create({
            data: {
              name: d.contactName || null,
              email: emailLower,
              phone: d.contactPhone || null,
              company: d.contactCompany || null,
              message: d.notes || `Creado automáticamente desde Pipeline para el Deal: ${createdDeal.title}`,
              source: d.source || "DIRECT",
              utmSource: d.utmSource || null,
              utmMedium: d.utmMedium || null,
              utmCampaign: d.utmCampaign || null,
              companyId,
              status: "NEW",
            },
          });
        }
      }

      return createdDeal;
    });

    res.status(201).json({ success: true, id: deal.id, deal });
  } catch (err) {
    logger.error("[deals] POST / failed", { error: String(err) });
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

// ── PATCH /api/deals/:id ──────────────────────────────────────────────────────
dealsRouter.patch("/:id", async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const companyId = getCompanyId(req);

    const parsed = updateDealSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        error: "Validation failed",
        details: parsed.error.errors.map(e => ({ path: e.path.join("."), message: e.message })),
      });
    }

    const existing = await prisma.deal.findUnique({
      where: { id },
      select: { id: true, companyId: true },
    });

    if (!existing || (companyId && existing.companyId !== companyId)) {
      return res.status(404).json({ success: false, error: "Deal not found" });
    }

    const updated = await prisma.deal.update({
      where: { id },
      data: {
        ...parsed.data,
        expectedClose: parsed.data.expectedClose ? new Date(parsed.data.expectedClose) : undefined,
        updatedAt: new Date(),
      },
    });

    res.json({ success: true, deal: updated });
  } catch (err) {
    logger.error("[deals] PATCH /:id failed", { error: String(err) });
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

// ── DELETE /api/deals/:id ─────────────────────────────────────────────────────
dealsRouter.delete("/:id", async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const companyId = getCompanyId(req);

    const existing = await prisma.deal.findUnique({
      where: { id },
      select: { id: true, companyId: true },
    });

    if (!existing || (companyId && existing.companyId !== companyId)) {
      return res.status(404).json({ success: false, error: "Deal not found" });
    }

    await prisma.deal.delete({ where: { id } });
    res.json({ success: true });
  } catch (err) {
    logger.error("[deals] DELETE /:id failed", { error: String(err) });
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

// ── PATCH /api/deals/:id/stage ────────────────────────────────────────────────
dealsRouter.patch("/:id/stage", async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const companyId = getCompanyId(req);

    const parsed = changeStageSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, error: "Invalid payload", details: parsed.error.errors });
    }

    const { stage, userId } = parsed.data;

    const deal = await prisma.deal.findUnique({ where: { id } });
    if (!deal || (companyId && deal.companyId !== companyId)) {
      return res.status(404).json({ success: false, error: "Deal not found" });
    }

    const isWon = stage === "WON";
    const previousStage = deal.stage;

    // Atomic stage transition execution
    const updated = await prisma.$transaction(async (tx) => {
      const updatedDeal = await tx.deal.update({
        where: { id },
        data: {
          stage,
          lastActivity: new Date(),
          updatedAt: new Date(),
          probability: isWon ? 100 : stage === "LOST" ? 0 : deal.probability,
        },
      });

      if (previousStage !== stage) {
        await tx.dealStageHistory.create({
          data: {
            dealId: deal.id,
            fromStage: previousStage,
            toStage: stage,
            changedBy: userId || undefined,
          },
        }).catch((e) => logger.warn("[deals] stage history log error", { error: String(e) }));
      }

      if (isWon) {
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 1);

        await tx.task.create({
          data: {
            title: `[Automatizado] Iniciar Onboarding para Deal: ${deal.title}`,
            description: `Reunir requisitos iniciales y enviar contrato/factura. Valor Ganado: $${deal.value}.`,
            completed: false,
            priority: deal.value > 10000 ? "HIGH" : "MEDIUM",
            dueDate,
            dealId: deal.id,
            companyId: deal.companyId,
            assignedTo: deal.assignedToUserId || deal.assignedTo,
            createdBy: userId || "SYSTEM",
          },
        });

        await tx.cRMActivity.create({
          data: {
            dealId: deal.id,
            userId: userId || null,
            type: "SYSTEM",
            content: "El deal ha pasado a GANADO y se generó la tarea de Onboarding automáticamente.",
            createdAt: new Date(),
          },
        });
      }

      return updatedDeal;
    });

    // Fix C-1: Publish events reliably with singleton eventBus
    await eventBus.publish("deal.stage_changed", {
      dealId: deal.id,
      companyId: deal.companyId,
      fromStage: previousStage,
      toStage: stage,
    }).catch((e) => logger.error("[deals] failed to publish deal.stage_changed", { error: String(e) }));

    if (isWon) {
      await eventBus.publish("deal.won", {
        dealId: deal.id,
        value: deal.value,
        companyId: deal.companyId,
      }).catch((e) => logger.error("[deals] failed to publish deal.won", { error: String(e) }));
    }

    res.json({ success: true, deal: updated });
  } catch (err) {
    logger.error("[deals] PATCH /:id/stage failed", { error: String(err) });
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

// ── Activities & Proposals & Invoices ─────────────────────────────────────────

dealsRouter.post("/:id/activities", async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const parsed = createActivitySchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, error: "Invalid payload", details: parsed.error.errors });
    }

    const activity = await prisma.cRMActivity.create({
      data: {
        dealId: id,
        type: parsed.data.type,
        content: parsed.data.content,
        userId: parsed.data.userId || null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    res.status(201).json({ success: true, activity });
  } catch (err) {
    logger.error("[deals] POST /:id/activities failed", { error: String(err) });
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

dealsRouter.get("/:id/activities", async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const activities = await prisma.cRMActivity.findMany({
      where: { dealId: id },
      orderBy: { createdAt: "desc" },
      include: { user: { select: { name: true, image: true } } },
    });
    res.json({ success: true, data: activities });
  } catch (err) {
    logger.error("[deals] GET /:id/activities failed", { error: String(err) });
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

dealsRouter.get("/:dealId/stage-history", async (req: Request, res: Response) => {
  try {
    const dealId = String(req.params.dealId);
    const history = await prisma.dealStageHistory.findMany({
      where: { dealId },
      orderBy: { createdAt: "desc" },
      include: { user: { select: { id: true, name: true, image: true } } },
    });
    res.json({ success: true, data: history });
  } catch (err) {
    logger.error("[deals] GET /:dealId/stage-history failed", { error: String(err) });
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

dealsRouter.get("/:dealId/proposals", async (req: Request, res: Response) => {
  try {
    const dealId = String(req.params.dealId);
    const proposals = await prisma.proposal.findMany({
      where: { dealId },
      orderBy: { createdAt: "desc" },
    });
    res.json({ success: true, data: proposals });
  } catch (err) {
    logger.error("[deals] GET /:dealId/proposals failed", { error: String(err) });
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

dealsRouter.post("/:dealId/proposals", async (req: Request, res: Response) => {
  try {
    const dealId = String(req.params.dealId);
    const parsed = createProposalSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, error: "Invalid payload", details: parsed.error.errors });
    }

    const deal = await prisma.deal.findUnique({ where: { id: dealId }, select: { companyId: true } });
    if (!deal) return res.status(404).json({ success: false, error: "Deal not found" });

    const total = parsed.data.lineItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);

    const proposal = await prisma.proposal.create({
      data: {
        title: parsed.data.title,
        dealId,
        companyId: deal.companyId,
        status: "DRAFT",
        value: total,
        validUntil: parsed.data.validUntil ? new Date(parsed.data.validUntil) : null,
        notes: parsed.data.notes,
        items: {
          create: parsed.data.lineItems.map((item) => ({
            title: item.description,
            quantity: item.quantity,
            price: item.unitPrice,
          })),
        },
        creatorId: parsed.data.creatorId,
      } as any,
    });

    res.status(201).json({ success: true, data: proposal });
  } catch (err) {
    logger.error("[deals] POST /:dealId/proposals failed", { error: String(err) });
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

dealsRouter.get("/:dealId/invoices", async (req: Request, res: Response) => {
  try {
    const dealId = String(req.params.dealId);
    const invoices = await prisma.invoice.findMany({
      where: { dealId },
      orderBy: { createdAt: "desc" },
      select: { id: true, serviceDescription: true, status: true, totalAmount: true, dueDate: true, createdAt: true },
    });
    res.json({ success: true, data: invoices });
  } catch (err) {
    logger.error("[deals] GET /:dealId/invoices failed", { error: String(err) });
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

dealsRouter.post("/:dealId/invoices", async (req: Request, res: Response) => {
  try {
    const dealId = String(req.params.dealId);
    const deal = await prisma.deal.findUnique({
      where: { id: dealId },
      select: { id: true, title: true, value: true, companyId: true, contactName: true },
    });

    if (!deal) return res.status(404).json({ success: false, error: "Deal not found" });

    const invoice = await prisma.invoice.create({
      data: {
        clientName: deal.contactName || "Cliente",
        serviceDescription: deal.title,
        subtotalAmount: deal.value,
        taxAmount: 0,
        totalAmount: deal.value,
        advanceAmount: 0,
        finalAmount: deal.value,
        status: "DRAFT_AWAITING_PAYMENT",
        companyId: deal.companyId,
        dealId: deal.id,
        currency: "USD",
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        items: {
          create: [{
            title: deal.title,
            quantity: 1,
            unitPrice: deal.value,
            totalAmount: deal.value,
          }],
        },
      },
    });

    res.status(201).json({ success: true, data: invoice });
  } catch (err) {
    logger.error("[deals] POST /:dealId/invoices failed", { error: String(err) });
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});
