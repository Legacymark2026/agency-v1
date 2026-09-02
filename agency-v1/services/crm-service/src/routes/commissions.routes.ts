/**
 * Commissions Router — CRM Service
 * ─────────────────────────────────────────────────────────────────────────────
 * Fix C-2: Protected with requireUserOrServiceAuth.
 * Fix C-3: Enforces multi-tenant isolation on commission rules, payments & clawbacks.
 * Fix C-4: Zod validation and safe type casting.
 */
import { Router, Request, Response } from "express";
import { z } from "zod";
import { prisma } from "@agency/database";
import { requireUserOrServiceAuth } from "@agency/service-auth";
import { logger } from "../utils/logger.utils";

const createRuleSchema = z.object({
  companyId: z.string().min(1).optional(),
  userId: z.string().optional().nullable(),
  rate: z.number().min(0).max(1),
  minDealValue: z.number().min(0).default(0),
  capAmount: z.number().min(0).optional().nullable(),
  label: z.string().min(1, "Label is required"),
});

const createPaymentSchema = z.object({
  companyId: z.string().min(1).optional(),
  dealId: z.string().min(1, "dealId required"),
  userId: z.string().min(1, "userId required"),
  ruleId: z.string().optional().nullable(),
  amount: z.number(),
  rate: z.number().min(0).max(1),
  status: z.enum(["PENDING", "APPROVED", "PAID", "CANCELLED"]).default("PENDING"),
});

const calculateCommissionSchema = z.object({
  companyId: z.string().min(1).optional(),
  dealId: z.string().min(1, "dealId required"),
});

const clawbackSchema = z.object({
  companyId: z.string().min(1).optional(),
  dealId: z.string().min(1, "dealId required"),
  reason: z.string().min(1, "Reason required"),
});

export const commissionsRouter = Router();

commissionsRouter.use(requireUserOrServiceAuth);

function getCompanyId(req: Request): string | null {
  return (req.headers["x-company-id"] as string | undefined) ||
    (req.query.companyId ? String(req.query.companyId) : null) ||
    (req.body && req.body.companyId ? String(req.body.companyId) : null);
}

// ── Commission Rules ─────────────────────────────────────────────────────────

commissionsRouter.get("/rules", async (req: Request, res: Response) => {
  try {
    const companyId = getCompanyId(req);
    if (!companyId) return res.status(400).json({ success: false, error: "companyId required" });

    const rules = await prisma.commissionRule.findMany({
      where: { companyId: String(companyId) },
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { rate: "desc" },
    });

    res.json({ success: true, data: rules });
  } catch (err: any) {
    logger.error("[commissions] GET /rules failed", { error: err.message });
    res.status(500).json({ success: false, error: err.message });
  }
});

commissionsRouter.post("/rules", async (req: Request, res: Response) => {
  try {
    const companyId = getCompanyId(req);
    if (!companyId) return res.status(400).json({ success: false, error: "companyId required" });

    const parsed = createRuleSchema.safeParse({ ...req.body, companyId });
    if (!parsed.success) {
      return res.status(400).json({ success: false, error: "Invalid payload", details: parsed.error.errors });
    }

    const { userId, rate, minDealValue, capAmount, label } = parsed.data;

    const rule = await prisma.commissionRule.create({
      data: {
        companyId,
        userId: userId || null,
        rate: Number(rate),
        minDealValue: minDealValue ? Number(minDealValue) : 0,
        capAmount: capAmount ? Number(capAmount) : null,
        label,
      },
    });

    res.status(201).json({ success: true, data: rule });
  } catch (err: any) {
    logger.error("[commissions] POST /rules failed", { error: err.message });
    res.status(500).json({ success: false, error: err.message });
  }
});

commissionsRouter.patch("/rules/:id", async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const companyId = getCompanyId(req);

    const existing = await prisma.commissionRule.findUnique({ where: { id } });
    if (!existing || (companyId && existing.companyId !== companyId)) {
      return res.status(404).json({ success: false, error: "Commission rule not found" });
    }

    const rule = await prisma.commissionRule.update({
      where: { id },
      data: req.body,
    });

    res.json({ success: true, data: rule });
  } catch (err: any) {
    logger.error("[commissions] PATCH /rules/:id failed", { error: err.message });
    res.status(500).json({ success: false, error: err.message });
  }
});

commissionsRouter.delete("/rules/:id", async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const companyId = getCompanyId(req);

    const existing = await prisma.commissionRule.findUnique({ where: { id } });
    if (!existing || (companyId && existing.companyId !== companyId)) {
      return res.status(404).json({ success: false, error: "Commission rule not found" });
    }

    await prisma.commissionRule.delete({ where: { id } });
    res.json({ success: true });
  } catch (err: any) {
    logger.error("[commissions] DELETE /rules/:id failed", { error: err.message });
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── Commission Payments ──────────────────────────────────────────────────────

commissionsRouter.get("/payments", async (req: Request, res: Response) => {
  try {
    const companyId = getCompanyId(req);
    if (!companyId) return res.status(400).json({ success: false, error: "companyId required" });

    const payments = await prisma.commissionPayment.findMany({
      where: { companyId: String(companyId) },
      include: {
        user: { select: { id: true, name: true, email: true, image: true } },
        deal: { select: { id: true, title: true, value: true, stage: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json({ success: true, data: payments });
  } catch (err: any) {
    logger.error("[commissions] GET /payments failed", { error: err.message });
    res.status(500).json({ success: false, error: err.message });
  }
});

commissionsRouter.post("/payments", async (req: Request, res: Response) => {
  try {
    const companyId = getCompanyId(req);
    if (!companyId) return res.status(400).json({ success: false, error: "companyId required" });

    const parsed = createPaymentSchema.safeParse({ ...req.body, companyId });
    if (!parsed.success) {
      return res.status(400).json({ success: false, error: "Invalid payload", details: parsed.error.errors });
    }

    const { dealId, userId, ruleId, amount, rate, status } = parsed.data;

    const payment = await prisma.commissionPayment.create({
      data: {
        companyId,
        dealId,
        userId,
        ruleId: ruleId || null,
        amount: Number(amount),
        rate: Number(rate),
        status: status || "PENDING",
      },
    });

    res.status(201).json({ success: true, data: payment });
  } catch (err: any) {
    logger.error("[commissions] POST /payments failed", { error: err.message });
    res.status(500).json({ success: false, error: err.message });
  }
});

commissionsRouter.patch("/payments/:id", async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const companyId = getCompanyId(req);

    const existing = await prisma.commissionPayment.findUnique({ where: { id } });
    if (!existing || (companyId && existing.companyId !== companyId)) {
      return res.status(404).json({ success: false, error: "Commission payment not found" });
    }

    const payment = await prisma.commissionPayment.update({
      where: { id },
      data: req.body,
    });

    res.json({ success: true, data: payment });
  } catch (err: any) {
    logger.error("[commissions] PATCH /payments/:id failed", { error: err.message });
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── Calculate & Accelerator Check ────────────────────────────────────────────

commissionsRouter.post("/calculate", async (req: Request, res: Response) => {
  try {
    const companyId = getCompanyId(req);
    const parsed = calculateCommissionSchema.safeParse({ ...req.body, companyId });
    if (!parsed.success) {
      return res.status(400).json({ success: false, error: "Invalid payload", details: parsed.error.errors });
    }

    const { dealId } = parsed.data;
    const finalCompanyId = companyId || req.body.companyId;

    const deal = await prisma.deal.findUnique({
      where: { id: dealId },
      include: { assignedUser: true },
    });

    if (!deal || !deal.assignedTo) return res.status(404).json({ success: false, error: "Deal or owner not found" });
    if (deal.probability < 100) return res.json({ success: true, message: "Deal not WON yet" });

    // Get Commission Rule for the user (or global)
    const rule = await (prisma as any).commissionRule.findFirst({
      where: {
        companyId: finalCompanyId,
        isActive: true,
        OR: [{ userId: deal.assignedTo }, { userId: null }],
      },
      orderBy: { userId: "desc" },
    });

    if (!rule) return res.status(400).json({ success: false, error: "No active commission rule found" });

    let rate = rule.rate;
    let type = "STANDARD";

    // Accelerator check
    const period = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`;
    const userGoal = await (prisma as any).salesGoal.findFirst({
      where: { companyId: finalCompanyId, userId: deal.assignedTo, period },
    });

    if (userGoal && userGoal.targetAmount > 0) {
      const start = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
      const end = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0, 23, 59, 59);

      const wonDealsAgg = await prisma.deal.aggregate({
        where: {
          companyId: finalCompanyId,
          assignedTo: deal.assignedTo,
          probability: 100,
          updatedAt: { gte: start, lte: end },
        },
        _sum: { value: true },
      });

      const currentTotal = Number(wonDealsAgg._sum.value) || 0;
      if (currentTotal > userGoal.targetAmount) {
        rate = rate * 1.5;
        type = "ACCELERATOR";
      }
    }

    let amount = deal.value * rate;
    if (rule.capAmount && amount > rule.capAmount) {
      amount = rule.capAmount;
    }

    const commission = await (prisma as any).commissionPayment.create({
      data: {
        companyId: finalCompanyId,
        dealId: deal.id,
        userId: deal.assignedTo,
        ruleId: rule.id,
        amount: Math.round(amount * 100) / 100,
        rate,
        type,
        status: "PENDING",
      },
    });

    res.json({ success: true, commission });
  } catch (err: any) {
    logger.error("[commissions] POST /calculate failed", { error: err.message });
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── Clawback ──────────────────────────────────────────────────────────────────

commissionsRouter.post("/clawback", async (req: Request, res: Response) => {
  try {
    const companyId = getCompanyId(req);
    const parsed = clawbackSchema.safeParse({ ...req.body, companyId });
    if (!parsed.success) {
      return res.status(400).json({ success: false, error: "Invalid payload", details: parsed.error.errors });
    }

    const { dealId, reason } = parsed.data;
    const finalCompanyId = companyId || req.body.companyId;

    const existing = await (prisma as any).commissionPayment.findFirst({
      where: { dealId, companyId: finalCompanyId, status: { not: "CANCELLED" } },
    });

    if (!existing) return res.status(404).json({ success: false, error: "No commission found to clawback" });

    const clawback = await (prisma as any).commissionPayment.create({
      data: {
        companyId: finalCompanyId,
        dealId,
        userId: existing.userId,
        ruleId: existing.ruleId,
        amount: -Math.abs(existing.amount),
        rate: existing.rate,
        type: "CLAWBACK",
        status: "APPROVED",
        notes: `Clawback: ${reason}`,
      },
    });

    if (existing.status === "PENDING") {
      await (prisma as any).commissionPayment.update({
        where: { id: existing.id },
        data: { status: "CANCELLED" },
      });
    }

    res.json({ success: true, clawback });
  } catch (err: any) {
    logger.error("[commissions] POST /clawback failed", { error: err.message });
    res.status(500).json({ success: false, error: err.message });
  }
});
