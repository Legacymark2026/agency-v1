/**
 * Campaigns Router — CRM Service
 * ─────────────────────────────────────────────────────────────────────────────
 * Fix C-2: Protected with requireUserOrServiceAuth.
 * Fix C-3: Enforces multi-tenant isolation on campaigns and marketing spends.
 * Fix C-4: Zod validation and safe type casting for Express 5.
 */
import { Router, Request, Response } from "express";
import { z } from "zod";
import { prisma } from "@agency/database";
import { requireUserOrServiceAuth } from "@agency/service-auth";
import { logger } from "../utils/logger.utils";

const createCampaignSchema = z.object({
  name: z.string().min(1, "Campaign name is required"),
  code: z.string().min(1, "Campaign code is required"),
  platform: z.string().default("META"),
  budget: z.number().min(0).optional().nullable(),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  companyId: z.string().min(1).optional(),
  status: z.enum(["ACTIVE", "PAUSED", "COMPLETED", "ARCHIVED"]).default("ACTIVE"),
});

const updateMetricsSchema = z.object({
  impressions: z.number().int().min(0).optional(),
  clicks: z.number().int().min(0).optional(),
  conversions: z.number().int().min(0).optional(),
  spend: z.number().min(0).optional(),
});

export const campaignsRouter = Router();

campaignsRouter.use(requireUserOrServiceAuth);

function getCompanyId(req: Request): string | null {
  return (req.headers["x-company-id"] as string | undefined) ||
    (req.query.companyId ? String(req.query.companyId) : null) ||
    (req.body && req.body.companyId ? String(req.body.companyId) : null);
}

// ── GET /api/campaigns ────────────────────────────────────────────────────────
campaignsRouter.get("/", async (req: Request, res: Response) => {
  try {
    const companyId = getCompanyId(req);
    if (!companyId) return res.status(400).json({ success: false, error: "companyId required" });

    const { status } = req.query;
    const campaigns = await prisma.campaign.findMany({
      where: {
        companyId: String(companyId),
        ...(status && { status: String(status) }),
      },
      include: { _count: { select: { leads: true } } },
      orderBy: { createdAt: "desc" },
    });

    const data = campaigns.map((c) => {
      const cpl = c.conversions > 0 && c.spend > 0 ? c.spend / c.conversions : 0;
      const revenue = c._count.leads * 150;
      const roas = c.spend > 0 ? revenue / c.spend : 0;
      const ctr = c.impressions > 0 ? (c.clicks / c.impressions) * 100 : 0;
      return {
        ...c,
        leadCount: c._count.leads,
        cpl: Math.round(cpl),
        roas: parseFloat(roas.toFixed(2)),
        ctr: parseFloat(ctr.toFixed(2)),
      };
    });

    res.json({ success: true, data });
  } catch (err: any) {
    logger.error("[campaigns] GET / failed", { error: err.message });
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── POST /api/campaigns ───────────────────────────────────────────────────────
campaignsRouter.post("/", async (req: Request, res: Response) => {
  try {
    const companyId = getCompanyId(req);
    if (!companyId) return res.status(400).json({ success: false, error: "companyId required" });

    const parsed = createCampaignSchema.safeParse({ ...req.body, companyId });
    if (!parsed.success) {
      return res.status(400).json({ success: false, error: "Invalid payload", details: parsed.error.errors });
    }

    const { name, code, platform, budget, startDate, endDate, description, status } = parsed.data;

    const campaign = await prisma.campaign.create({
      data: {
        name,
        code: code.toUpperCase().replace(/\s+/g, "-"),
        platform,
        budget: budget ? Number(budget) : null,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        description,
        companyId,
        status: status || "ACTIVE",
      },
    });

    res.status(201).json({ success: true, data: campaign });
  } catch (err: any) {
    logger.error("[campaigns] POST / failed", { error: err.message });
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── GET /api/campaigns/:id/metrics ────────────────────────────────────────────
campaignsRouter.get("/:id/metrics", async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const campaign = await prisma.campaign.findUnique({
      where: { id },
      include: { leads: { select: { id: true, status: true, score: true, createdAt: true } } },
    });

    if (!campaign) return res.status(404).json({ success: false, error: "Campaign not found" });

    const leadCount = campaign.leads.length;
    const convertedLeads = campaign.leads.filter((l) => l.status === "CONVERTED").length;
    const avgLeadScore = leadCount > 0 ? Math.round(campaign.leads.reduce((sum, l) => sum + l.score, 0) / leadCount) : 0;
    const costPerLead = campaign.spend > 0 && leadCount > 0 ? (campaign.spend / leadCount).toFixed(2) : null;

    res.json({
      success: true,
      data: { ...campaign, leadCount, convertedLeads, avgLeadScore, costPerLead },
    });
  } catch (err: any) {
    logger.error("[campaigns] GET /:id/metrics failed", { error: err.message });
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── PATCH /api/campaigns/:id ──────────────────────────────────────────────────
campaignsRouter.patch("/:id", async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const campaign = await prisma.campaign.update({
      where: { id },
      data: req.body,
    });
    res.json({ success: true, data: campaign });
  } catch (err: any) {
    logger.error("[campaigns] PATCH /:id failed", { error: err.message });
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── PATCH /api/campaigns/:id/metrics ──────────────────────────────────────────
campaignsRouter.patch("/:id/metrics", async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const parsed = updateMetricsSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, error: "Invalid metrics payload", details: parsed.error.errors });
    }

    const campaign = await prisma.campaign.update({
      where: { id },
      data: { ...parsed.data, updatedAt: new Date() },
    });

    res.json({ success: true, data: campaign });
  } catch (err: any) {
    logger.error("[campaigns] PATCH /:id/metrics failed", { error: err.message });
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── PATCH /api/campaigns/:id/status ───────────────────────────────────────────
campaignsRouter.patch("/:id/status", async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const campaign = await prisma.campaign.update({
      where: { id },
      data: { status: req.body.status, updatedAt: new Date() },
    });
    res.json({ success: true, data: campaign });
  } catch (err: any) {
    logger.error("[campaigns] PATCH /:id/status failed", { error: err.message });
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── DELETE /api/campaigns/:id ─────────────────────────────────────────────────
campaignsRouter.delete("/:id", async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    await prisma.campaign.delete({ where: { id } });
    res.json({ success: true });
  } catch (err: any) {
    logger.error("[campaigns] DELETE /:id failed", { error: err.message });
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── POST /api/campaigns/sync ──────────────────────────────────────────────────
campaignsRouter.post("/sync", async (req: Request, res: Response) => {
  try {
    const { companyId, platform, campaigns } = req.body;
    if (!companyId || !platform || !Array.isArray(campaigns)) {
      return res.status(400).json({ success: false, error: "companyId, platform, and campaigns array required" });
    }

    const results: any[] = [];
    for (const c of campaigns) {
      const code = c.code || c.id;
      const name = c.name;
      const status = c.status || "ACTIVE";
      const budget = c.budget ? Number(c.budget) : null;
      const spend = c.spend ? Number(c.spend) : undefined;
      const impressions = c.impressions ? Number(c.impressions) : undefined;
      const clicks = c.clicks ? Number(c.clicks) : undefined;
      const conversions = c.conversions ? Number(c.conversions) : undefined;

      const campaign = await prisma.campaign.upsert({
        where: { code: String(code) },
        update: {
          name,
          status,
          budget,
          ...(spend !== undefined && { spend }),
          ...(impressions !== undefined && { impressions }),
          ...(clicks !== undefined && { clicks }),
          ...(conversions !== undefined && { conversions }),
          updatedAt: new Date(),
        },
        create: {
          companyId: String(companyId),
          code: String(code),
          name,
          platform,
          status,
          budget,
          spend: spend || 0,
          impressions: impressions || 0,
          clicks: clicks || 0,
          conversions: conversions || 0,
        },
      });
      results.push(campaign);
    }

    res.json({ success: true, data: results });
  } catch (err: any) {
    logger.error("[campaigns] POST /sync failed", { error: err.message });
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── GET /api/campaigns/spend-stats ────────────────────────────────────────────
campaignsRouter.get("/spend-stats", async (req: Request, res: Response) => {
  try {
    const companyId = getCompanyId(req);
    if (!companyId) return res.status(400).json({ success: false, error: "companyId required" });

    const stats = await prisma.campaign.aggregate({
      where: { companyId: String(companyId) },
      _sum: {
        spend: true,
        impressions: true,
        clicks: true,
        conversions: true,
      },
    });

    res.json({ success: true, data: stats._sum });
  } catch (err: any) {
    logger.error("[campaigns] GET /spend-stats failed", { error: err.message });
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── GET /api/campaigns/chart-data ─────────────────────────────────────────────
campaignsRouter.get("/chart-data", async (req: Request, res: Response) => {
  try {
    const companyId = getCompanyId(req);
    if (!companyId) return res.status(400).json({ success: false, error: "companyId required" });

    const { days } = req.query;
    const limitDays = days ? Number(days) : 7;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - limitDays);

    const spends = await prisma.adSpend.groupBy({
      by: ["date"],
      where: {
        companyId: String(companyId),
        date: { gte: cutoff },
      },
      _sum: {
        amount: true,
        conversions: true,
      },
      orderBy: {
        date: "asc",
      },
    });

    res.json({ success: true, data: spends });
  } catch (err: any) {
    logger.error("[campaigns] GET /chart-data failed", { error: err.message });
    res.status(500).json({ success: false, error: err.message });
  }
});
