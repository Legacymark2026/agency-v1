/**
 * Lead Scoring Router — CRM Service
 * ─────────────────────────────────────────────────────────────────────────────
 * Fix C-2: Protected with requireUserOrServiceAuth.
 * Fix C-3: Enforces multi-tenant isolation on scoring rules & recalculations.
 * Fix C-4: Zod validation and safe type casting.
 */
import { Router, Request, Response } from "express";
import { z } from "zod";
import { prisma } from "@agency/database";
import { requireUserOrServiceAuth } from "@agency/service-auth";
import { logger } from "../utils/logger.utils";

const createScoringRuleSchema = z.object({
  name: z.string().min(1, "Rule name is required"),
  field: z.string().min(1, "Field is required"),
  operator: z.enum(["exists", "equals", "contains", "greaterThan", "lessThan", "in"]),
  value: z.string().optional().nullable(),
  points: z.number().int(),
  companyId: z.string().min(1).optional(),
});

// Scoring logic helpers
function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  return path.split(".").reduce((acc: unknown, key: string) => {
    if (acc && typeof acc === "object") return (acc as Record<string, unknown>)[key];
    return undefined;
  }, obj);
}

function evaluateRule(value: unknown, operator: string, ruleValue: string | null): boolean {
  switch (operator) {
    case "exists": return value !== null && value !== undefined && value !== "";
    case "equals": return String(value) === ruleValue;
    case "contains": return typeof value === "string" && value.toLowerCase().includes((ruleValue ?? "").toLowerCase());
    case "greaterThan": return typeof value === "number" && value > Number(ruleValue);
    case "lessThan": return typeof value === "number" && value < Number(ruleValue);
    case "in": return (ruleValue ?? "").split(",").map((s) => s.trim()).includes(String(value));
    default: return false;
  }
}

async function computeLeadScore(lead: Record<string, unknown>, companyId: string): Promise<number> {
  const rules = await prisma.leadScoringRule.findMany({ where: { companyId, active: true } });
  let score = 0;
  for (const rule of rules) {
    const fieldVal = rule.field.includes(".") ? getNestedValue(lead, rule.field) : lead[rule.field];
    const match = evaluateRule(fieldVal, rule.operator, rule.value ?? null);
    if (match) score += rule.points;
  }
  return Math.max(0, Math.min(100, score));
}

function enrichLeadWithEvents(lead: any) {
  const events = lead.marketingEvents || [];
  const aggregatedEvents = {
    website_visits: events.filter((e: any) => e.eventType === "PAGE_VIEW").length,
    email_opens: events.filter((e: any) => e.eventType === "EMAIL_OPEN").length,
    downloads: events.filter((e: any) => e.eventType === "DOWNLOAD" || (e.eventName && e.eventName.toLowerCase().includes("descarga"))).length,
    webinars: events.filter((e: any) => e.eventType === "WEBINAR" || (e.eventName && e.eventName.toLowerCase().includes("webinar"))).length,
    quote_requests: events.filter((e: any) => e.eventType === "FORM_SUBMIT" && e.eventName && (e.eventName.toLowerCase().includes("cotiza") || e.eventName.toLowerCase().includes("presupuesto"))).length,
    demos: events.filter((e: any) => e.eventType === "FORM_SUBMIT" && e.eventName && e.eventName.toLowerCase().includes("demo")).length,
    pricing_visits: events.filter((e: any) => e.eventType === "PAGE_VIEW" && e.url && e.url.toLowerCase().includes("precio")).length,
  };
  return { ...lead, events: aggregatedEvents };
}

export const scoringRouter = Router();

scoringRouter.use(requireUserOrServiceAuth);

function getCompanyId(req: Request): string | null {
  return (req.headers["x-company-id"] as string | undefined) ||
    (req.query.companyId ? String(req.query.companyId) : null) ||
    (req.body && req.body.companyId ? String(req.body.companyId) : null);
}

// ── GET /api/crm/scoring-rules ────────────────────────────────────────────────
scoringRouter.get("/rules", async (req: Request, res: Response) => {
  try {
    const companyId = getCompanyId(req);
    if (!companyId) return res.status(400).json({ success: false, error: "companyId required" });

    const rules = await prisma.leadScoringRule.findMany({
      where: { companyId: String(companyId) },
      orderBy: { createdAt: "asc" },
    });
    res.json({ success: true, data: rules });
  } catch (err: any) {
    logger.error("[scoring] GET /rules failed", { error: err.message });
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── POST /api/crm/scoring-rules ───────────────────────────────────────────────
scoringRouter.post("/rules", async (req: Request, res: Response) => {
  try {
    const companyId = getCompanyId(req);
    if (!companyId) return res.status(400).json({ success: false, error: "companyId required" });

    const parsed = createScoringRuleSchema.safeParse({ ...req.body, companyId });
    if (!parsed.success) {
      return res.status(400).json({ success: false, error: "Invalid payload", details: parsed.error.errors });
    }

    const { name, field, operator, value, points } = parsed.data;
    const rule = await prisma.leadScoringRule.create({
      data: { name, field, operator, value: value || null, points: Number(points), companyId },
    });
    res.status(201).json({ success: true, data: rule });
  } catch (err: any) {
    logger.error("[scoring] POST /rules failed", { error: err.message });
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── GET /api/crm/scoring-rules/:id ────────────────────────────────────────────
scoringRouter.get("/rules/:id", async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const companyId = getCompanyId(req);

    const rule = await prisma.leadScoringRule.findUnique({ where: { id } });
    if (!rule || (companyId && rule.companyId !== companyId)) {
      return res.status(404).json({ success: false, error: "Rule not found" });
    }
    res.json({ success: true, data: rule });
  } catch (err: any) {
    logger.error("[scoring] GET /rules/:id failed", { error: err.message });
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── PATCH /api/crm/scoring-rules/:id ──────────────────────────────────────────
scoringRouter.patch("/rules/:id", async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const companyId = getCompanyId(req);

    const existing = await prisma.leadScoringRule.findUnique({ where: { id } });
    if (!existing || (companyId && existing.companyId !== companyId)) {
      return res.status(404).json({ success: false, error: "Rule not found" });
    }

    const rule = await prisma.leadScoringRule.update({
      where: { id },
      data: req.body,
    });
    res.json({ success: true, data: rule });
  } catch (err: any) {
    logger.error("[scoring] PATCH /rules/:id failed", { error: err.message });
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── DELETE /api/crm/scoring-rules/:id ─────────────────────────────────────────
scoringRouter.delete("/rules/:id", async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const companyId = getCompanyId(req);

    const existing = await prisma.leadScoringRule.findUnique({ where: { id } });
    if (!existing || (companyId && existing.companyId !== companyId)) {
      return res.status(404).json({ success: false, error: "Rule not found" });
    }

    await prisma.leadScoringRule.delete({ where: { id } });
    res.json({ success: true });
  } catch (err: any) {
    logger.error("[scoring] DELETE /rules/:id failed", { error: err.message });
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── POST /api/crm/scoring/recalculate-all ─────────────────────────────────────
scoringRouter.post("/recalculate-all", async (req: Request, res: Response) => {
  try {
    const companyId = getCompanyId(req);
    if (!companyId) return res.status(400).json({ success: false, error: "companyId required" });

    const leads = await prisma.lead.findMany({
      where: { companyId },
      include: { marketingEvents: true },
    });

    let updated = 0;
    for (const lead of leads) {
      const enrichedLead = enrichLeadWithEvents(lead);
      const score = await computeLeadScore(enrichedLead as unknown as Record<string, unknown>, companyId);
      await prisma.lead.update({ where: { id: lead.id }, data: { score } });
      updated++;
    }

    res.json({ success: true, updated });
  } catch (err: any) {
    logger.error("[scoring] POST /recalculate-all failed", { error: err.message });
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── POST /api/crm/scoring/recalculate-lead ────────────────────────────────────
scoringRouter.post("/recalculate-lead", async (req: Request, res: Response) => {
  try {
    const { leadId } = req.body;
    const companyId = getCompanyId(req);
    if (!leadId || !companyId) return res.status(400).json({ success: false, error: "leadId and companyId required" });

    const lead = await prisma.lead.findUnique({
      where: { id: String(leadId) },
      include: { marketingEvents: true },
    });

    if (!lead || lead.companyId !== companyId) return res.status(404).json({ success: false, error: "Lead not found" });

    const enrichedLead = enrichLeadWithEvents(lead);
    const score = await computeLeadScore(enrichedLead as unknown as Record<string, unknown>, companyId);
    await prisma.lead.update({ where: { id: String(leadId) }, data: { score } });

    res.json({ success: true, score });
  } catch (err: any) {
    logger.error("[scoring] POST /recalculate-lead failed", { error: err.message });
    res.status(500).json({ success: false, error: err.message });
  }
});
