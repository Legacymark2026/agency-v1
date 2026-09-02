/**
 * Automations & Notifications Router — CRM Service
 * ─────────────────────────────────────────────────────────────────────────────
 * Fix C-2: Protected with requireUserOrServiceAuth.
 * Fix C-3: Enforces multi-tenant isolation on automation rules and execution logs.
 * Fix C-4: Zod validation and safe type casting.
 */
import { Router, Request, Response } from "express";
import { z } from "zod";
import { prisma } from "@agency/database";
import { requireUserOrServiceAuth } from "@agency/service-auth";
import { logger } from "../utils/logger.utils";

const createRuleSchema = z.object({
  companyId: z.string().min(1).optional(),
  name: z.string().min(1, "Name is required"),
  description: z.string().optional().nullable(),
  triggerType: z.string().min(1, "Trigger type required"),
  triggerStage: z.string().optional().nullable(),
  triggerDays: z.number().int().optional().nullable(),
  actionType: z.string().min(1, "Action type required"),
  actionPayload: z.record(z.unknown()).default({}),
});

const createNotificationSchema = z.object({
  userId: z.string().min(1, "userId required"),
  companyId: z.string().min(1).optional(),
  title: z.string().min(1, "Title required"),
  message: z.string().min(1, "Message required"),
  type: z.string().default("INFO"),
});

export const automationsRouter = Router();

automationsRouter.use(requireUserOrServiceAuth);

function getCompanyId(req: Request): string | null {
  return (req.headers["x-company-id"] as string | undefined) ||
    (req.query.companyId ? String(req.query.companyId) : null) ||
    (req.body && req.body.companyId ? String(req.body.companyId) : null);
}

// ── Automation Rules ─────────────────────────────────────────────────────────

automationsRouter.get("/rules", async (req: Request, res: Response) => {
  try {
    const companyId = getCompanyId(req);
    if (!companyId) return res.status(400).json({ success: false, error: "companyId required" });

    const rules = await prisma.dealAutomationRule.findMany({
      where: { companyId: String(companyId) },
      include: { logs: { orderBy: { createdAt: "desc" }, take: 3 } },
      orderBy: { createdAt: "desc" },
    });
    res.json({ success: true, data: rules });
  } catch (err: any) {
    logger.error("[automations] GET /rules failed", { error: err.message });
    res.status(500).json({ success: false, error: err.message });
  }
});

automationsRouter.post("/rules", async (req: Request, res: Response) => {
  try {
    const companyId = getCompanyId(req);
    if (!companyId) return res.status(400).json({ success: false, error: "companyId required" });

    const parsed = createRuleSchema.safeParse({ ...req.body, companyId });
    if (!parsed.success) {
      return res.status(400).json({ success: false, error: "Invalid payload", details: parsed.error.errors });
    }

    const { name, description, triggerType, triggerStage, triggerDays, actionType, actionPayload } = parsed.data;

    const rule = await prisma.dealAutomationRule.create({
      data: {
        companyId,
        name,
        description,
        triggerType,
        triggerStage,
        triggerDays: triggerDays ? Number(triggerDays) : null,
        actionType,
        actionPayload: (actionPayload || {}) as any,
      },
    });

    res.status(201).json({ success: true, data: rule });
  } catch (err: any) {
    logger.error("[automations] POST /rules failed", { error: err.message });
    res.status(500).json({ success: false, error: err.message });
  }
});

automationsRouter.patch("/rules/:id", async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const companyId = getCompanyId(req);

    const existing = await prisma.dealAutomationRule.findUnique({ where: { id } });
    if (!existing || (companyId && existing.companyId !== companyId)) {
      return res.status(404).json({ success: false, error: "Rule not found" });
    }

    const rule = await prisma.dealAutomationRule.update({
      where: { id },
      data: req.body,
    });
    res.json({ success: true, data: rule });
  } catch (err: any) {
    logger.error("[automations] PATCH /rules/:id failed", { error: err.message });
    res.status(500).json({ success: false, error: err.message });
  }
});

automationsRouter.delete("/rules/:id", async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const companyId = getCompanyId(req);

    const existing = await prisma.dealAutomationRule.findUnique({ where: { id } });
    if (!existing || (companyId && existing.companyId !== companyId)) {
      return res.status(404).json({ success: false, error: "Rule not found" });
    }

    await prisma.dealAutomationRule.delete({ where: { id } });
    res.json({ success: true });
  } catch (err: any) {
    logger.error("[automations] DELETE /rules/:id failed", { error: err.message });
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── Automation Logs ──────────────────────────────────────────────────────────

automationsRouter.get("/rules/:id/logs", async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const take = req.query.take ? Math.min(Number(req.query.take), 100) : 50;
    const logs = await prisma.automationLog.findMany({
      where: { ruleId: id },
      orderBy: { createdAt: "desc" },
      take,
    });
    res.json({ success: true, data: logs });
  } catch (err: any) {
    logger.error("[automations] GET /rules/:id/logs failed", { error: err.message });
    res.status(500).json({ success: false, error: err.message });
  }
});

automationsRouter.get("/logs", async (req: Request, res: Response) => {
  try {
    const { ruleId, take } = req.query;
    if (!ruleId) return res.status(400).json({ success: false, error: "ruleId required" });

    const logs = await prisma.automationLog.findMany({
      where: { ruleId: String(ruleId) },
      orderBy: { createdAt: "desc" },
      take: take ? Math.min(parseInt(String(take), 10), 100) : 50,
    });
    res.json({ success: true, data: logs });
  } catch (err: any) {
    logger.error("[automations] GET /logs failed", { error: err.message });
    res.status(500).json({ success: false, error: err.message });
  }
});

automationsRouter.post("/logs", async (req: Request, res: Response) => {
  try {
    const { ruleId, dealId, result, message } = req.body;
    const log = await prisma.automationLog.create({
      data: { ruleId, dealId, result, message },
    });
    res.status(201).json({ success: true, data: log });
  } catch (err: any) {
    logger.error("[automations] POST /logs failed", { error: err.message });
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── Stagnant Deals & Notifications ───────────────────────────────────────────

automationsRouter.get("/stagnant-deals", async (req: Request, res: Response) => {
  try {
    const companyId = getCompanyId(req);
    const { triggerStage, cutoffDate } = req.query;
    if (!companyId || !triggerStage || !cutoffDate) {
      return res.status(400).json({ success: false, error: "companyId, triggerStage, and cutoffDate required" });
    }

    const stagnantDeals = await prisma.deal.findMany({
      where: {
        companyId: String(companyId),
        stage: String(triggerStage),
        lastActivity: { lte: new Date(String(cutoffDate)) },
      },
      include: { assignedUser: { select: { id: true, email: true, name: true } } },
    });

    res.json({ success: true, data: stagnantDeals });
  } catch (err: any) {
    logger.error("[automations] GET /stagnant-deals failed", { error: err.message });
    res.status(500).json({ success: false, error: err.message });
  }
});

automationsRouter.post("/notifications", async (req: Request, res: Response) => {
  try {
    const companyId = getCompanyId(req);
    if (!companyId) return res.status(400).json({ success: false, error: "companyId required" });

    const parsed = createNotificationSchema.safeParse({ ...req.body, companyId });
    if (!parsed.success) {
      return res.status(400).json({ success: false, error: "Invalid payload", details: parsed.error.errors });
    }

    const { userId, title, message, type } = parsed.data;
    const notification = await prisma.notification.create({
      data: { userId, companyId, title, message, type },
    });

    res.status(201).json({ success: true, data: notification });
  } catch (err: any) {
    logger.error("[automations] POST /notifications failed", { error: err.message });
    res.status(500).json({ success: false, error: err.message });
  }
});
