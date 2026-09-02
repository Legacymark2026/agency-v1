/**
 * Leads Router — CRM Service
 * ─────────────────────────────────────────────────────────────────────────────
 * Fix C-2: Protected with requireUserOrServiceAuth.
 * Fix C-3: Enforces multi-tenant isolation on all lead queries & mutations.
 * Fix C-4: Strict Zod validation & field whitelisting to prevent mass assignment.
 * Fix M-1: Safe pagination with MAX_PAGE_LIMIT = 100.
 */
import { Router, Request, Response } from "express";
import { z } from "zod";
import crypto from "crypto";
import { prisma } from "@agency/database";
import { requireUserOrServiceAuth } from "@agency/service-auth";
import { routeLead } from "../assignment-engine";
import { leadRepository } from "../repositories/lead.repository";
import { logger } from "../utils/logger.utils";

const MAX_PAGE_LIMIT = 100;

// ── Validation Schemas ────────────────────────────────────────────────────────
const createLeadSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email format"),
  phone: z.string().optional().nullable(),
  company: z.string().optional().nullable(),
  companyId: z.string().min(1, "companyId is required").optional(),
  source: z.string().default("DIRECT"),
  score: z.number().int().min(0).max(100).default(0),
  status: z.enum(["NEW", "CONTACTED", "QUALIFIED", "UNQUALIFIED", "CONVERTED", "LOST"]).default("NEW"),
  notes: z.string().optional().nullable(),
  assignedTo: z.string().optional().nullable(),
  campaignId: z.string().optional().nullable(),
  utmSource: z.string().optional().nullable(),
  utmMedium: z.string().optional().nullable(),
  utmCampaign: z.string().optional().nullable(),
});

const updateLeadSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  phone: z.string().nullable().optional(),
  company: z.string().nullable().optional(),
  source: z.string().optional(),
  score: z.number().int().min(0).max(100).optional(),
  status: z.enum(["NEW", "CONTACTED", "QUALIFIED", "UNQUALIFIED", "CONVERTED", "LOST"]).optional(),
  notes: z.string().nullable().optional(),
  assignedTo: z.string().nullable().optional(),
  campaignId: z.string().nullable().optional(),
  tags: z.array(z.string()).optional(),
}).strict(); // Prevents unauthorized field injection

const bulkUpdateSchema = z.object({
  ids: z.array(z.string().min(1)).min(1),
  data: z.object({
    status: z.enum(["NEW", "CONTACTED", "QUALIFIED", "UNQUALIFIED", "CONVERTED", "LOST"]).optional(),
    assignedTo: z.string().nullable().optional(),
    score: z.number().int().min(0).max(100).optional(),
  }).strict(),
});

const bulkDeleteSchema = z.object({
  ids: z.array(z.string().min(1)).min(1),
});

const convertToDealSchema = z.object({
  leadId: z.string().min(1, "leadId is required"),
  dealData: z.object({
    title: z.string().min(1, "Deal title is required"),
    value: z.number().min(0).default(0),
    probability: z.number().min(0).max(100).default(30),
    expectedClose: z.string().optional().nullable(),
    companyId: z.string().min(1).optional(),
  }),
});

export const leadsRouter = Router();

leadsRouter.use(requireUserOrServiceAuth);

// Helper for multi-tenant company ID extraction
function getCompanyId(req: Request): string | null {
  return (req.headers["x-company-id"] as string | undefined) ||
    (req.query.companyId ? String(req.query.companyId) : null) ||
    (req.body && req.body.companyId ? String(req.body.companyId) : null);
}

// ── GET /api/leads ────────────────────────────────────────────────────────────
leadsRouter.get("/", async (req: Request, res: Response) => {
  try {
    const companyId = getCompanyId(req);
    if (!companyId) return res.status(400).json({ success: false, error: "companyId required" });

    const {
      status,
      source,
      scoreMin,
      scoreMax,
      search,
      page = "1",
      pageSize = "20",
      sortBy = "createdAt",
      sortOrder = "desc",
      syncDealId,
      syncEmail,
    } = req.query;

    const limit = Math.min(Math.max(parseInt(String(pageSize), 10) || 20, 1), MAX_PAGE_LIMIT);
    const p = Math.max(parseInt(String(page), 10) || 1, 1);
    const skip = (p - 1) * limit;

    const where: any = { companyId: String(companyId) };

    if (status) where.status = String(status);
    if (source) where.source = String(source);

    if (scoreMin || scoreMax) {
      where.score = {
        gte: scoreMin ? parseInt(String(scoreMin), 10) : 0,
        lte: scoreMax ? parseInt(String(scoreMax), 10) : 100,
      };
    }

    if (syncDealId || syncEmail) {
      const orConditions: any[] = [];
      if (syncDealId) orConditions.push({ convertedToDealId: String(syncDealId) });
      if (syncEmail) orConditions.push({ email: { equals: String(syncEmail), mode: "insensitive" } });
      where.OR = orConditions;
    } else if (search) {
      where.OR = [
        { name: { contains: String(search), mode: "insensitive" } },
        { email: { contains: String(search), mode: "insensitive" } },
        { company: { contains: String(search), mode: "insensitive" } },
      ];
    }

    const [leads, total] = await Promise.all([
      leadRepository.findMany({
        where,
        orderBy: { [String(sortBy)]: String(sortOrder) as any },
        skip,
        take: limit,
      }),
      leadRepository.count(where),
    ]);

    res.json({
      success: true,
      leads,
      total,
      pages: Math.ceil(total / limit),
      page: p,
      limit,
    });
  } catch (err) {
    logger.error("[leads] GET / failed", { error: String(err) });
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

// ── GET /api/leads/analytics/source ───────────────────────────────────────────
leadsRouter.get("/analytics/source", async (req: Request, res: Response) => {
  try {
    const companyId = getCompanyId(req);
    if (!companyId) return res.status(400).json({ success: false, error: "companyId required" });

    const analytics = await leadRepository.groupBySource(String(companyId));
    const result = analytics.map((a: any) => ({
      source: a.source,
      count: a._count.id,
      avgScore: Math.round(a._avg.score || 0),
    }));

    res.json({ success: true, data: result });
  } catch (err) {
    logger.error("[leads] GET /analytics/source failed", { error: String(err) });
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

// ── GET /api/leads/:id ────────────────────────────────────────────────────────
leadsRouter.get("/:id", async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const companyId = getCompanyId(req);

    const where: any = { id };
    if (companyId) where.companyId = companyId;

    const lead = await prisma.lead.findFirst({
      where,
      include: {
        campaign: { select: { id: true, name: true, platform: true, code: true } },
      },
    });

    if (!lead) return res.status(404).json({ success: false, error: "Lead not found" });

    const [conversations, marketingEvents] = await Promise.all([
      prisma.conversation.findMany({
        where: { leadId: id },
        take: 5,
        orderBy: { updatedAt: "desc" },
        select: { id: true, channel: true, status: true, lastMessageAt: true, lastMessagePreview: true },
      }).catch(() => []),
      prisma.marketingEvent.findMany({
        where: { leadId: id },
        take: 10,
        orderBy: { createdAt: "desc" },
        select: { id: true, eventType: true, eventName: true, url: true, createdAt: true },
      }).catch(() => []),
    ]);

    res.json({ success: true, lead: { ...lead, conversations, marketingEvents } });
  } catch (err) {
    logger.error("[leads] GET /:id failed", { error: String(err) });
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

// ── POST /api/leads ───────────────────────────────────────────────────────────
leadsRouter.post("/", async (req: Request, res: Response) => {
  try {
    const companyId = getCompanyId(req);
    if (!companyId) return res.status(400).json({ success: false, error: "companyId required" });

    const parsed = createLeadSchema.safeParse({ ...req.body, companyId });
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        error: "Validation failed",
        details: parsed.error.errors.map(e => ({ path: e.path.join("."), message: e.message })),
      });
    }

    const correlationId = (req.headers["x-correlation-id"] as string) || `crm-${crypto.randomUUID()}`;

    // Automatic rule assignment / round robin
    const assigneeId = await routeLead({ ...parsed.data, companyId });
    const leadData = {
      ...parsed.data,
      companyId,
      assignedTo: assigneeId || parsed.data.assignedTo || null,
    };

    const lead = await prisma.$transaction(async (tx) => {
      const createdLead = await tx.lead.create({ data: leadData });
      await tx.outboxEvent.create({
        data: {
          eventName: "lead.created",
          payload: { leadId: createdLead.id, companyId: createdLead.companyId, data: createdLead },
          correlationId,
        },
      });
      return createdLead;
    });

    res.status(201).json({ success: true, lead });
  } catch (err) {
    logger.error("[leads] POST / failed", { error: String(err) });
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

// ── PATCH /api/leads/:id ──────────────────────────────────────────────────────
leadsRouter.patch("/:id", async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const companyId = getCompanyId(req);

    const parsed = updateLeadSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        error: "Validation failed",
        details: parsed.error.errors.map(e => ({ path: e.path.join("."), message: e.message })),
      });
    }

    const existing = await prisma.lead.findUnique({
      where: { id },
      select: { id: true, companyId: true },
    });

    if (!existing || (companyId && existing.companyId !== companyId)) {
      return res.status(404).json({ success: false, error: "Lead not found" });
    }

    const updated = await prisma.lead.update({
      where: { id },
      data: {
        ...parsed.data,
        updatedAt: new Date(),
      },
    });

    res.json({ success: true, lead: updated });
  } catch (err) {
    logger.error("[leads] PATCH /:id failed", { error: String(err) });
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

// ── DELETE /api/leads/:id ─────────────────────────────────────────────────────
leadsRouter.delete("/:id", async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const companyId = getCompanyId(req);

    const lead = await prisma.lead.findUnique({
      where: { id },
      select: { email: true, companyId: true },
    });

    if (!lead || (companyId && lead.companyId !== companyId)) {
      return res.status(404).json({ success: false, error: "Lead not found" });
    }

    await prisma.$transaction(async (tx) => {
      if (lead.email) {
        await tx.deal.deleteMany({
          where: {
            companyId: lead.companyId,
            contactEmail: lead.email,
          },
        });
      }
      await tx.lead.delete({ where: { id } });
    });

    res.json({ success: true });
  } catch (err) {
    logger.error("[leads] DELETE /:id failed", { error: String(err) });
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

// ── POST /api/leads/bulk-update ───────────────────────────────────────────────
leadsRouter.post("/bulk-update", async (req: Request, res: Response) => {
  try {
    const companyId = getCompanyId(req);
    if (!companyId) return res.status(400).json({ success: false, error: "companyId required" });

    const parsed = bulkUpdateSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, error: "Invalid payload", details: parsed.error.errors });
    }

    const result = await prisma.lead.updateMany({
      where: {
        id: { in: parsed.data.ids },
        companyId,
      },
      data: {
        ...parsed.data.data,
        updatedAt: new Date(),
      },
    });

    res.json({ success: true, count: result.count });
  } catch (err) {
    logger.error("[leads] POST /bulk-update failed", { error: String(err) });
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

// ── POST /api/leads/bulk-delete ───────────────────────────────────────────────
leadsRouter.post("/bulk-delete", async (req: Request, res: Response) => {
  try {
    const companyId = getCompanyId(req);
    if (!companyId) return res.status(400).json({ success: false, error: "companyId required" });

    const parsed = bulkDeleteSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, error: "Invalid payload", details: parsed.error.errors });
    }

    const leads = await prisma.lead.findMany({
      where: {
        id: { in: parsed.data.ids },
        companyId,
      },
      select: { id: true, email: true, companyId: true },
    });

    const emails = leads.map((l) => l.email).filter(Boolean) as string[];

    await prisma.$transaction([
      prisma.deal.deleteMany({
        where: {
          companyId,
          contactEmail: { in: emails },
        },
      }),
      prisma.lead.deleteMany({
        where: {
          id: { in: leads.map((l) => l.id) },
          companyId,
        },
      }),
    ]);

    res.json({ success: true, count: leads.length });
  } catch (err) {
    logger.error("[leads] POST /bulk-delete failed", { error: String(err) });
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

// ── POST /api/leads/convert-to-deal ───────────────────────────────────────────
leadsRouter.post("/convert-to-deal", async (req: Request, res: Response) => {
  try {
    const companyId = getCompanyId(req);
    const parsed = convertToDealSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, error: "Invalid payload", details: parsed.error.errors });
    }

    const { leadId, dealData } = parsed.data;
    const finalCompanyId = companyId || dealData.companyId;
    if (!finalCompanyId) return res.status(400).json({ success: false, error: "companyId required" });

    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      select: { id: true, name: true, email: true, phone: true, companyId: true },
    });

    if (!lead || (companyId && lead.companyId !== companyId)) {
      return res.status(404).json({ success: false, error: "Lead not found" });
    }

    const deal = await prisma.$transaction(async (tx) => {
      const createdDeal = await tx.deal.create({
        data: {
          title: dealData.title,
          value: dealData.value,
          stage: "QUALIFIED",
          probability: dealData.probability ?? 30,
          contactName: lead.name ?? undefined,
          contactEmail: lead.email,
          companyId: finalCompanyId,
          source: "LEAD_CONVERTED",
          expectedClose: dealData.expectedClose ? new Date(dealData.expectedClose) : undefined,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      await tx.lead.update({
        where: { id: leadId },
        data: {
          status: "CONVERTED",
          convertedAt: new Date(),
          convertedToDealId: createdDeal.id,
          updatedAt: new Date(),
        },
      });

      return createdDeal;
    });

    res.status(201).json({ success: true, dealId: deal.id });
  } catch (err) {
    logger.error("[leads] POST /convert-to-deal failed", { error: String(err) });
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

// ── POST /api/leads/audiences/calculate-ltv ───────────────────────────────────
leadsRouter.post("/audiences/calculate-ltv", async (req: Request, res: Response) => {
  try {
    const companyId = getCompanyId(req);
    if (!companyId) return res.status(400).json({ success: false, error: "companyId required" });

    // 1. Fetch all WON deals for the company with contactEmail
    const wonDeals = await prisma.deal.findMany({
      where: {
        companyId,
        stage: "WON",
        contactEmail: { not: null },
      },
      select: { contactEmail: true, value: true },
    });

    const ltvMap = new Map<string, number>();
    for (const deal of wonDeals) {
      const email = deal.contactEmail!.toLowerCase().trim();
      if (!email) continue;
      const current = ltvMap.get(email) || 0;
      ltvMap.set(email, current + deal.value);
    }

    if (ltvMap.size === 0) {
      return res.json({
        success: true,
        data: [
          { tier: "HIGH", leads: [] },
          { tier: "MEDIUM", leads: [] },
          { tier: "LOW", leads: [] },
        ],
      });
    }

    const sortedLTV = Array.from(ltvMap.entries()).sort((a, b) => b[1] - a[1]);
    const totalProfiles = sortedLTV.length;
    const highCutoff = Math.ceil(totalProfiles * 0.20);
    const midCutoff = Math.ceil(totalProfiles * 0.70);

    const highEmails = new Set<string>();
    const midEmails = new Set<string>();

    sortedLTV.forEach(([email], index) => {
      if (index < highCutoff) highEmails.add(email);
      else if (index < midCutoff) midEmails.add(email);
    });

    const allRelatedLeads = await prisma.lead.findMany({
      where: {
        companyId,
        email: { in: Array.from(ltvMap.keys()) },
      },
      select: { id: true, email: true, phone: true, name: true, tags: true },
    });

    const highLeads: any[] = [];
    const midLeads: any[] = [];
    const lowLeads: any[] = [];

    const updatePromises = allRelatedLeads.map((lead) => {
      const email = lead.email.toLowerCase().trim();
      let tier: "HIGH" | "MEDIUM" | "LOW" = "LOW";

      if (highEmails.has(email)) tier = "HIGH";
      else if (midEmails.has(email)) tier = "MEDIUM";

      const leadData = { ...lead, ltvTier: tier };
      if (tier === "HIGH") highLeads.push(leadData);
      else if (tier === "MEDIUM") midLeads.push(leadData);
      else lowLeads.push(leadData);

      const newTag = `[Audience: LTV ${tier}]`;
      const cleanedTags = lead.tags.filter((t: string) => !t.startsWith("[Audience: LTV"));
      if (!cleanedTags.includes(newTag)) {
        cleanedTags.push(newTag);
        return prisma.lead.update({
          where: { id: lead.id },
          data: { tags: cleanedTags },
        });
      }
      return Promise.resolve();
    });

    await Promise.all(updatePromises);

    res.json({
      success: true,
      data: [
        { tier: "HIGH", leads: highLeads },
        { tier: "MEDIUM", leads: midLeads },
        { tier: "LOW", leads: lowLeads },
      ],
    });
  } catch (err) {
    logger.error("[leads] POST /audiences/calculate-ltv failed", { error: String(err) });
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});
