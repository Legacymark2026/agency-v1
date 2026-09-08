"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.statsRouter = void 0;
/**
 * Notification Stats & Delivery Metrics Router — Notification Service
 * ─────────────────────────────────────────────────────────────────────────────
 * Fix C-1: Secured with requireUserOrServiceAuth.
 * Provides delivery KPIs, unread rates, type breakdowns, and queue depths per company.
 */
const express_1 = require("express");
const database_1 = require("@agency/database");
const service_auth_1 = require("@agency/service-auth");
const redis_singleton_1 = require("../lib/redis.singleton");
const notification_queue_1 = require("../queue/notification.queue");
exports.statsRouter = (0, express_1.Router)();
exports.statsRouter.use(service_auth_1.requireUserOrServiceAuth);
function getCompanyId(req) {
    return req.headers["x-company-id"] ||
        (req.query.companyId ? String(req.query.companyId) : null) ||
        (req.body && req.body.companyId ? String(req.body.companyId) : null);
}
// ── GET /notifications/stats ──────────────────────────────────────────────────
exports.statsRouter.get(["/notifications/stats", "/api/notifications/stats"], async (req, res) => {
    try {
        const companyId = getCompanyId(req);
        if (!companyId)
            return res.status(400).json({ success: false, error: "companyId required" });
        const { period = "7d" } = req.query;
        const periodDays = period === "30d" ? 30 : period === "24h" ? 1 : 7;
        const since = new Date(Date.now() - periodDays * 86400000);
        const [total, unread, byType] = await Promise.all([
            database_1.prisma.notification.count({
                where: { companyId: String(companyId), createdAt: { gte: since } },
            }),
            database_1.prisma.notification.count({
                where: { companyId: String(companyId), isRead: false, createdAt: { gte: since } },
            }),
            database_1.prisma.notification.groupBy({
                by: ["type"],
                where: { companyId: String(companyId), createdAt: { gte: since } },
                _count: true,
            }),
        ]);
        const emailQueueLength = await redis_singleton_1.redisClient.llen("notification:email_queue").catch(() => 0);
        const dlqStats = await (0, notification_queue_1.getDLQStats)().catch(() => ({ failedCount: 0, delayedCount: 0 }));
        res.json({
            success: true,
            period,
            total,
            unread,
            readRate: total > 0 ? ((total - unread) / total * 100).toFixed(1) + "%" : "0%",
            byType: byType.map((t) => ({ type: t.type, count: t._count })),
            emailQueueLength,
            dlqStats,
        });
    }
    catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});
//# sourceMappingURL=stats.routes.js.map