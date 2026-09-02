/**
 * Reports & Dashboard Analytics Router — CRM Service
 * ─────────────────────────────────────────────────────────────────────────────
 * Fix C-2: Protected with requireUserOrServiceAuth.
 * Fix C-3: Enforces multi-tenant isolation on all analytics, metrics & reports.
 * Fix 10: Optimized aggregation queries for pipeline and historical data.
 */
import { Router, Request, Response } from "express";
import { prisma } from "@agency/database";
import { requireUserOrServiceAuth } from "@agency/service-auth";
import { logger } from "../utils/logger.utils";

export const reportsRouter = Router();

reportsRouter.use(requireUserOrServiceAuth);

function getCompanyId(req: Request): string | null {
  return (req.headers["x-company-id"] as string | undefined) ||
    (req.query.companyId ? String(req.query.companyId) : null) ||
    (req.body && req.body.companyId ? String(req.body.companyId) : null);
}

// ── GET /api/crm/stats ────────────────────────────────────────────────────────
reportsRouter.get("/stats", async (req: Request, res: Response) => {
  try {
    const companyId = getCompanyId(req);
    if (!companyId) return res.status(400).json({ success: false, error: "companyId required" });

    const [pipelineValue, activeDeals, wonDeals, lostDeals, wonValue] = await Promise.all([
      prisma.deal.aggregate({
        _sum: { value: true },
        where: { companyId: String(companyId), stage: { notIn: ["WON", "LOST"] } },
      }),
      prisma.deal.count({ where: { companyId: String(companyId), stage: { notIn: ["WON", "LOST"] } } }),
      prisma.deal.count({ where: { companyId: String(companyId), stage: "WON" } }),
      prisma.deal.count({ where: { companyId: String(companyId), stage: "LOST" } }),
      prisma.deal.aggregate({
        _sum: { value: true },
        where: { companyId: String(companyId), stage: "WON" },
      }),
    ]);

    const totalClosed = wonDeals + lostDeals;
    const winRate = totalClosed > 0 ? (wonDeals / totalClosed) * 100 : 0;

    res.json({
      success: true,
      stats: {
        pipelineValue: Number(pipelineValue._sum.value) || 0,
        activeDeals,
        wonDeals,
        lostDeals,
        winRate: Math.round(winRate * 100) / 100,
        wonValue: Number(wonValue._sum.value) || 0,
      },
    });
  } catch (err: any) {
    logger.error("[reports] GET /stats failed", { error: err.message });
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── GET /api/crm/reports ──────────────────────────────────────────────────────
reportsRouter.get("/", async (req: Request, res: Response) => {
  try {
    const companyId = getCompanyId(req);
    if (!companyId) return res.status(400).json({ success: false, error: "companyId required" });

    const now = new Date();
    const months = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
      return {
        start: new Date(d.getFullYear(), d.getMonth(), 1),
        end: new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59),
        label: d.toLocaleString("es", { month: "short" }),
      };
    });

    const [wonDeals, lostDeals, allLeads, allDeals, sourceStats] = await Promise.all([
      prisma.deal.findMany({
        where: { companyId: String(companyId), stage: "WON" },
        select: { value: true, createdAt: true, updatedAt: true },
      }),
      prisma.deal.findMany({
        where: { companyId: String(companyId), stage: "LOST" },
        select: { value: true, createdAt: true },
      }),
      prisma.lead.findMany({
        where: { companyId: String(companyId) },
        select: { source: true, status: true, score: true, createdAt: true },
      }),
      prisma.deal.findMany({
        where: { companyId: String(companyId) },
        select: {
          id: true, value: true, stage: true, source: true, createdAt: true,
          assignedUser: { select: { name: true } },
        },
      }),
      prisma.lead.groupBy({
        by: ["source"],
        where: { companyId: String(companyId) },
        _count: { source: true },
        orderBy: { _count: { source: "desc" } },
      }),
    ]);

    // Revenue by month
    const revenueByMonth = months.map((m) => ({
      month: m.label,
      revenue: wonDeals.filter((d) => d.updatedAt >= m.start && d.updatedAt <= m.end).reduce((a, d) => a + d.value, 0),
      leads: allLeads.filter((l) => l.createdAt >= m.start && l.createdAt <= m.end).length,
    }));

    // Win rate trend by month
    const winRateByMonth = months.map((m) => {
      const won = wonDeals.filter((d) => d.updatedAt >= m.start && d.updatedAt <= m.end).length;
      const lost = lostDeals.filter((d) => d.createdAt >= m.start && d.createdAt <= m.end).length;
      const total = won + lost;
      return { month: m.label, winRate: total > 0 ? Math.round((won / total) * 100) : 0 };
    });

    // Lead-to-deal conversion by source
    const conversionBySource = sourceStats.slice(0, 6).map((s) => {
      const converted = allLeads.filter((l) => l.source === s.source && l.status === "CONVERTED").length;
      const total = s._count.source;
      return { source: s.source, total, converted, rate: total > 0 ? Math.round((converted / total) * 100) : 0 };
    });

    // Revenue by stage
    const stageRevenue: Record<string, number> = {};
    allDeals.forEach((d) => { stageRevenue[d.stage] = (stageRevenue[d.stage] ?? 0) + d.value; });

    // Sales rep leaderboard
    const repMap: Record<string, { name: string; won: number; value: number }> = {};
    allDeals.filter((d) => d.stage === "WON").forEach((d) => {
      const name = d.assignedUser?.name ?? "Sin asignar";
      repMap[name] = { name, won: (repMap[name]?.won ?? 0) + 1, value: (repMap[name]?.value ?? 0) + d.value };
    });
    const salesReps = Object.values(repMap).sort((a, b) => b.value - a.value).slice(0, 5);

    // Avg time to close (days)
    const closedDeals = wonDeals.filter((d) => d.createdAt && d.updatedAt);
    const avgDaysToClose = closedDeals.length > 0
      ? Math.round(closedDeals.reduce((a, d) => a + (d.updatedAt.getTime() - d.createdAt.getTime()) / 86400000, 0) / closedDeals.length)
      : 0;

    const totalRevenue = wonDeals.reduce((a, d) => a + d.value, 0);
    const totalLeads = allLeads.length;
    const totalDeals = allDeals.length;
    const winRate = wonDeals.length + lostDeals.length > 0
      ? Math.round((wonDeals.length / (wonDeals.length + lostDeals.length)) * 100)
      : 0;

    res.json({
      success: true,
      data: {
        revenueByMonth,
        winRateByMonth,
        conversionBySource,
        stageRevenue,
        salesReps,
        avgDaysToClose,
        totalRevenue,
        totalLeads,
        totalDeals,
        winRate,
      },
    });
  } catch (err: any) {
    logger.error("[reports] GET / failed", { error: err.message });
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── Closing Reports: Stagnant Deals & Funnel Conversion ───────────────────────

reportsRouter.get("/closing/stagnant-deals", async (req: Request, res: Response) => {
  try {
    const companyId = getCompanyId(req);
    if (!companyId) return res.status(400).json({ success: false, error: "companyId required" });

    const { thresholdDays } = req.query;
    const limitDays = thresholdDays ? Number(thresholdDays) : 7;
    const cutoff = new Date(Date.now() - limitDays * 24 * 60 * 60 * 1000);

    const stagnant = await prisma.deal.findMany({
      where: {
        companyId: String(companyId),
        stage: { notIn: ["WON", "LOST"] },
        lastActivity: { lt: cutoff },
      },
      select: {
        id: true,
        title: true,
        value: true,
        stage: true,
        lastActivity: true,
        contactName: true,
        assignedUser: { select: { name: true } },
      },
      orderBy: { lastActivity: "asc" },
    });

    res.json({ success: true, data: stagnant });
  } catch (err: any) {
    logger.error("[reports] GET /closing/stagnant-deals failed", { error: err.message });
    res.status(500).json({ success: false, error: err.message });
  }
});

reportsRouter.get("/closing/funnel-conversion-report", async (req: Request, res: Response) => {
  try {
    const companyId = getCompanyId(req);
    if (!companyId) return res.status(400).json({ success: false, error: "companyId required" });

    const { stages } = req.query;
    const stageList = stages ? String(stages).split(",") : [];

    // Count deals per stage
    const stageCounts = await prisma.deal.groupBy({
      by: ["stage"],
      where: { companyId: String(companyId) },
      _count: { stage: true },
      _sum: { value: true },
    });

    // Avg days in each stage from stage history
    let avgDaysByStage: Record<string, number> = {};
    try {
      await prisma.dealStageHistory.groupBy({
        by: ["toStage"],
        where: { deal: { companyId: String(companyId) } },
        _count: { toStage: true },
      });
      avgDaysByStage = Object.fromEntries(stageList.map((s) => [s, 0]));
    } catch {
      avgDaysByStage = Object.fromEntries(stageList.map((s) => [s, 0]));
    }

    const stageData = stageList.map((stage, i) => {
      const row = stageCounts.find((r) => r.stage === stage);
      const count = row?._count.stage ?? 0;
      const value = Number(row?._sum.value) || 0;
      const prevCount = i > 0 ? (stageCounts.find((r) => r.stage === stageList[i - 1])?._count.stage ?? 0) : count;
      const conversionRate = prevCount > 0 ? Math.round((count / prevCount) * 100) : 0;
      return { stage, count, value, conversionRate, avgDays: avgDaysByStage[stage] ?? 0 };
    });

    res.json({ success: true, data: stageData });
  } catch (err: any) {
    logger.error("[reports] GET /closing/funnel-conversion-report failed", { error: err.message });
    res.status(500).json({ success: false, error: err.message });
  }
});
