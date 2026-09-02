/**
 * Notification Stats & Delivery Metrics Router — Notification Service
 * ─────────────────────────────────────────────────────────────────────────────
 * Fix C-1: Secured with requireUserOrServiceAuth.
 * Provides delivery KPIs, unread rates, type breakdowns, and queue depths per company.
 */
import { Router, Request, Response } from "express";
import { prisma } from "@agency/database";
import { requireUserOrServiceAuth } from "@agency/service-auth";
import { redisClient } from "../lib/redis.singleton";
import { getDLQStats } from "../queue/notification.queue";

export const statsRouter = Router();

statsRouter.use(requireUserOrServiceAuth);

function getCompanyId(req: Request): string | null {
  return (req.headers["x-company-id"] as string | undefined) ||
    (req.query.companyId ? String(req.query.companyId) : null) ||
    (req.body && req.body.companyId ? String(req.body.companyId) : null);
}

// ── GET /notifications/stats ──────────────────────────────────────────────────
statsRouter.get(["/notifications/stats", "/api/notifications/stats"], async (req: Request, res: Response) => {
  try {
    const companyId = getCompanyId(req);
    if (!companyId) return res.status(400).json({ success: false, error: "companyId required" });

    const { period = "7d" } = req.query;
    const periodDays = period === "30d" ? 30 : period === "24h" ? 1 : 7;
    const since = new Date(Date.now() - periodDays * 86400000);

    const [total, unread, byType] = await Promise.all([
      prisma.notification.count({
        where: { companyId: String(companyId), createdAt: { gte: since } },
      }),
      prisma.notification.count({
        where: { companyId: String(companyId), isRead: false, createdAt: { gte: since } },
      }),
      prisma.notification.groupBy({
        by: ["type"],
        where: { companyId: String(companyId), createdAt: { gte: since } },
        _count: true,
      }),
    ]);

    const emailQueueLength = await redisClient.llen("notification:email_queue").catch(() => 0);
    const dlqStats = await getDLQStats().catch(() => ({ failedCount: 0, delayedCount: 0 }));

    res.json({
      success: true,
      period,
      total,
      unread,
      readRate: total > 0 ? ((total - unread) / total * 100).toFixed(1) + "%" : "0%",
      byType: byType.map((t: typeof byType[number]) => ({ type: t.type, count: t._count })),
      emailQueueLength,
      dlqStats,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});
