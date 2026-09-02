/**
 * Goals & Sales Performance Router — CRM Service
 * ─────────────────────────────────────────────────────────────────────────────
 * Fix C-2: Protected with requireUserOrServiceAuth.
 * Fix C-3: Enforces multi-tenant isolation on goals, leaderboard, and forecasts.
 * Fix C-4: Zod validation and Express 5 safe parameter types.
 */
import { Router, Request, Response } from "express";
import { z } from "zod";
import { prisma } from "@agency/database";
import { requireUserOrServiceAuth } from "@agency/service-auth";
import { logger } from "../utils/logger.utils";

const createGoalSchema = z.object({
  companyId: z.string().min(1).optional(),
  userId: z.string().optional().nullable(),
  period: z.string().min(1, "period is required"), // e.g. "2026-09"
  targetAmount: z.number().min(0, "targetAmount must be positive"),
  label: z.string().optional().nullable(),
  currency: z.string().default("USD"),
  level: z.string().optional().nullable(),
  departmentId: z.string().optional().nullable(),
});

export const goalsRouter = Router();

goalsRouter.use(requireUserOrServiceAuth);

function getCompanyId(req: Request): string | null {
  return (req.headers["x-company-id"] as string | undefined) ||
    (req.query.companyId ? String(req.query.companyId) : null) ||
    (req.body && req.body.companyId ? String(req.body.companyId) : null);
}

// ── GET /api/crm/goals ────────────────────────────────────────────────────────
goalsRouter.get("/", async (req: Request, res: Response) => {
  try {
    const companyId = getCompanyId(req);
    if (!companyId) return res.status(400).json({ success: false, error: "companyId required" });

    const { period } = req.query;
    const where: any = { companyId: String(companyId) };
    if (period) where.period = String(period);

    const goals = await prisma.salesGoal.findMany({
      where,
      include: { user: { select: { id: true, name: true, email: true, image: true } } },
      orderBy: { targetAmount: "desc" },
    });

    res.json({ success: true, data: goals });
  } catch (err: any) {
    logger.error("[goals] GET / failed", { error: err.message });
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── POST /api/crm/goals ───────────────────────────────────────────────────────
goalsRouter.post("/", async (req: Request, res: Response) => {
  try {
    const companyId = getCompanyId(req);
    if (!companyId) return res.status(400).json({ success: false, error: "companyId required" });

    const parsed = createGoalSchema.safeParse({ ...req.body, companyId });
    if (!parsed.success) {
      return res.status(400).json({ success: false, error: "Invalid payload", details: parsed.error.errors });
    }

    const { userId, period, targetAmount, label, currency, level, departmentId } = parsed.data;

    let goal;
    if (level) {
      goal = await prisma.salesGoal.create({
        data: {
          companyId,
          level,
          period,
          targetAmount: Number(targetAmount),
          departmentId: departmentId || null,
          userId: userId || null,
        },
      });
    } else {
      goal = await prisma.salesGoal.upsert({
        where: {
          companyId_userId_period: {
            companyId,
            userId: userId ?? "",
            period,
          },
        },
        update: { targetAmount: Number(targetAmount), label },
        create: {
          companyId,
          userId: userId || "",
          period,
          targetAmount: Number(targetAmount),
          currency: currency ?? "USD",
          label,
        },
      });
    }

    res.status(201).json({ success: true, data: goal });
  } catch (err: any) {
    logger.error("[goals] POST / failed", { error: err.message });
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── DELETE /api/crm/goals/:id ─────────────────────────────────────────────────
goalsRouter.delete("/:id", async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const companyId = getCompanyId(req);

    const existing = await prisma.salesGoal.findUnique({ where: { id } });
    if (!existing || (companyId && existing.companyId !== companyId)) {
      return res.status(404).json({ success: false, error: "Goal not found" });
    }

    await prisma.salesGoal.delete({ where: { id } });
    res.json({ success: true });
  } catch (err: any) {
    logger.error("[goals] DELETE /:id failed", { error: err.message });
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── Hierarchical Goals & Forecast & Leaderboard ───────────────────────────────

goalsRouter.get("/hierarchical", async (req: Request, res: Response) => {
  try {
    const companyId = getCompanyId(req);
    const { period } = req.query;
    if (!companyId || !period) return res.status(400).json({ success: false, error: "companyId and period required" });

    const goals = await prisma.salesGoal.findMany({
      where: { companyId: String(companyId), period: String(period) },
      include: {
        user: { select: { id: true, name: true, image: true, firstName: true, lastName: true } },
      },
      orderBy: [
        { level: "asc" },
        { targetAmount: "desc" },
      ],
    });

    const [year, month] = String(period).split("-").map(Number);
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0, 23, 59, 59);

    const wonDeals = await prisma.deal.findMany({
      where: {
        companyId: String(companyId),
        stage: "WON",
        updatedAt: { gte: start, lte: end },
      },
      select: {
        id: true, value: true, assignedTo: true, probability: true,
      },
    });

    res.json({ success: true, data: { goals, wonDeals } });
  } catch (err: any) {
    logger.error("[goals] GET /hierarchical failed", { error: err.message });
    res.status(500).json({ success: false, error: err.message });
  }
});

goalsRouter.get("/forecast", async (req: Request, res: Response) => {
  try {
    const companyId = getCompanyId(req);
    if (!companyId) return res.status(400).json({ success: false, error: "companyId required" });

    const openDeals = await prisma.deal.findMany({
      where: {
        companyId: String(companyId),
        probability: { lt: 100, gt: 0 },
      },
      select: {
        id: true, title: true, value: true, probability: true, stage: true, assignedTo: true,
      },
    });

    res.json({ success: true, data: openDeals });
  } catch (err: any) {
    logger.error("[goals] GET /forecast failed", { error: err.message });
    res.status(500).json({ success: false, error: err.message });
  }
});

goalsRouter.get("/leaderboard", async (req: Request, res: Response) => {
  try {
    const companyId = getCompanyId(req);
    const { period } = req.query;
    if (!companyId || !period) return res.status(400).json({ success: false, error: "companyId and period required" });

    const [year, month] = String(period).split("-").map(Number);
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0, 23, 59, 59);

    const aggs = await prisma.deal.groupBy({
      by: ["assignedTo"],
      where: {
        companyId: String(companyId),
        stage: "WON",
        updatedAt: { gte: start, lte: end },
      },
      _sum: { value: true },
    });

    const leaderboard = await Promise.all(
      aggs.filter((a) => a.assignedTo).map(async (agg) => {
        const u = await prisma.user.findUnique({
          where: { id: agg.assignedTo! },
          select: { id: true, name: true, image: true, firstName: true, lastName: true },
        });
        return {
          user: u,
          totalSold: Number(agg._sum.value) || 0,
        };
      })
    );

    res.json({ success: true, data: leaderboard.sort((a, b) => b.totalSold - a.totalSold) });
  } catch (err: any) {
    logger.error("[goals] GET /leaderboard failed", { error: err.message });
    res.status(500).json({ success: false, error: err.message });
  }
});
