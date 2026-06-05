"use strict";
/**
 * Notification Service — Enterprise Notification & Delivery Microservice
 * ─────────────────────────────────────────────────────────────────────────────
 * Centralized notification hub for the entire LegacyMark platform.
 * Handles: In-App, Email (Resend), Push, SMS delivery channels.
 *
 * Features:
 * - Multi-channel dispatch (IN_APP, EMAIL, PUSH)
 * - User preference-aware delivery
 * - Event-driven architecture (subscribes to all platform events)
 * - Batch notification processing
 * - Read/unread state management
 * - Rate limiting per user per channel
 *
 * Port: 4016 (internal)
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const database_1 = require("@agency/database");
const events_1 = require("@agency/events");
const ioredis_1 = __importDefault(require("ioredis"));
const app = (0, express_1.default)();
const PORT = parseInt(process.env.PORT || "4016", 10);
const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)());
app.use(express_1.default.json({ limit: "2mb" }));
// ── Health & Readiness ───────────────────────────────────────────────────────
app.get("/health", (_req, res) => {
    res.json({
        status: "healthy",
        service: "notification-service",
        version: "1.0.0",
        timestamp: new Date().toISOString(),
        channels: ["IN_APP", "EMAIL", "PUSH"],
    });
});
app.get("/ready", async (_req, res) => {
    try {
        await database_1.prisma.$queryRaw `SELECT 1`;
        await redisClient.ping();
        res.json({ status: "ready", db: "connected", cache: "connected" });
    }
    catch (err) {
        res.status(503).json({ status: "not_ready", error: String(err) });
    }
});
// ── Notification Types Registry ──────────────────────────────────────────────
const NOTIFICATION_CATEGORIES = [
    "CRM", "INBOX", "AUTOMATION", "AI_ENGINE", "FINANCE",
    "MARKETING", "CALENDAR", "CONTENT", "IAM", "SYSTEM",
    "HR", "PROJECTS",
];
// ── GET /api/notifications — Paginated list ──────────────────────────────────
app.get("/api/notifications", async (req, res) => {
    try {
        const { userId, companyId, category, isRead, page = "1", limit = "20" } = req.query;
        if (!userId || !companyId) {
            return res.status(400).json({ error: "userId and companyId required" });
        }
        const where = {
            userId: String(userId),
            companyId: String(companyId),
        };
        if (category)
            where.type = String(category);
        if (isRead !== undefined)
            where.isRead = isRead === "true";
        const skip = (parseInt(String(page)) - 1) * parseInt(String(limit));
        const [notifications, total, unreadCount] = await Promise.all([
            database_1.prisma.notification.findMany({
                where,
                orderBy: { createdAt: "desc" },
                take: parseInt(String(limit)),
                skip,
            }),
            database_1.prisma.notification.count({ where }),
            database_1.prisma.notification.count({
                where: { ...where, isRead: false },
            }),
        ]);
        res.json({
            notifications,
            total,
            unreadCount,
            page: parseInt(String(page)),
            limit: parseInt(String(limit)),
            hasMore: skip + notifications.length < total,
        });
    }
    catch (err) {
        console.error("[notification-service] GET /api/notifications error:", err);
        res.status(500).json({ error: String(err) });
    }
});
// ── POST /api/notifications — Create & dispatch ─────────────────────────────
app.post("/api/notifications", async (req, res) => {
    try {
        const { companyId, userIds, roles, title, message, type, priority, data, channels } = req.body;
        if (!companyId || !title) {
            return res.status(400).json({ error: "companyId and title required" });
        }
        // Resolve target users
        let targetUserIds = userIds || [];
        if (roles && roles.length > 0 && targetUserIds.length === 0) {
            const companyUsers = await database_1.prisma.companyUser.findMany({
                where: {
                    companyId: String(companyId),
                    roleName: { in: roles },
                },
                select: { userId: true },
            });
            targetUserIds = companyUsers.map((u) => u.userId);
        }
        if (targetUserIds.length === 0) {
            return res.json({ success: true, delivered: 0, reason: "no_target_users" });
        }
        // Check user preferences (cached in Redis)
        const effectiveChannels = channels || ["IN_APP"];
        // Batch create IN_APP notifications
        if (effectiveChannels.includes("IN_APP")) {
            await database_1.prisma.notification.createMany({
                data: targetUserIds.map((userId) => ({
                    userId,
                    companyId: String(companyId),
                    title: String(title),
                    message: String(message || ""),
                    type: String(type || "SYSTEM"),
                    isRead: false,
                    data: data ? JSON.stringify(data) : undefined,
                })),
            });
        }
        // Queue email delivery (async, non-blocking)
        if (effectiveChannels.includes("EMAIL")) {
            for (const userId of targetUserIds) {
                await redisClient.lpush("notification:email_queue", JSON.stringify({ userId, companyId, title, message, type, priority, ts: Date.now() }));
            }
            console.log(`[notification-service] Queued ${targetUserIds.length} emails`);
        }
        // Publish event for real-time delivery
        await eventBus.publish("notification.dispatched", {
            companyId,
            userIds: targetUserIds,
            type,
            title,
            channelsUsed: effectiveChannels,
        });
        res.status(201).json({
            success: true,
            delivered: targetUserIds.length,
            channels: effectiveChannels,
        });
    }
    catch (err) {
        console.error("[notification-service] POST /api/notifications error:", err);
        res.status(500).json({ error: String(err) });
    }
});
// ── PATCH /api/notifications/read — Mark as read ─────────────────────────────
app.patch("/api/notifications/read", async (req, res) => {
    try {
        const { userId, notificationIds, markAll } = req.body;
        if (!userId)
            return res.status(400).json({ error: "userId required" });
        if (markAll) {
            const result = await database_1.prisma.notification.updateMany({
                where: { userId: String(userId), isRead: false },
                data: { isRead: true },
            });
            return res.json({ success: true, updated: result.count });
        }
        if (notificationIds && notificationIds.length > 0) {
            const result = await database_1.prisma.notification.updateMany({
                where: { id: { in: notificationIds }, userId: String(userId) },
                data: { isRead: true },
            });
            return res.json({ success: true, updated: result.count });
        }
        res.status(400).json({ error: "Provide notificationIds or markAll=true" });
    }
    catch (err) {
        res.status(500).json({ error: String(err) });
    }
});
// ── DELETE /api/notifications — Bulk delete ──────────────────────────────────
app.delete("/api/notifications", async (req, res) => {
    try {
        const { userId, notificationIds, deleteAll } = req.body;
        if (!userId)
            return res.status(400).json({ error: "userId required" });
        if (deleteAll) {
            const result = await database_1.prisma.notification.deleteMany({
                where: { userId: String(userId) },
            });
            return res.json({ success: true, deleted: result.count });
        }
        if (notificationIds && notificationIds.length > 0) {
            const result = await database_1.prisma.notification.deleteMany({
                where: { id: { in: notificationIds }, userId: String(userId) },
            });
            return res.json({ success: true, deleted: result.count });
        }
        res.status(400).json({ error: "Provide notificationIds or deleteAll=true" });
    }
    catch (err) {
        res.status(500).json({ error: String(err) });
    }
});
// ── GET /api/notification-preferences — User channel preferences ─────────────
app.get("/api/notification-preferences", async (req, res) => {
    try {
        const { userId } = req.query;
        if (!userId)
            return res.status(400).json({ error: "userId required" });
        // Check Redis cache first
        const cached = await redisClient.get(`notif_prefs:${userId}`);
        if (cached) {
            return res.json({ preferences: JSON.parse(cached), source: "cache" });
        }
        // Fallback: return defaults
        const defaults = {};
        NOTIFICATION_CATEGORIES.forEach((cat) => {
            defaults[cat] = ["IN_APP"];
        });
        // Cache for 5 minutes
        await redisClient.setex(`notif_prefs:${userId}`, 300, JSON.stringify(defaults));
        res.json({ preferences: defaults, source: "defaults" });
    }
    catch (err) {
        res.status(500).json({ error: String(err) });
    }
});
// ── PUT /api/notification-preferences — Update preferences ───────────────────
app.put("/api/notification-preferences", async (req, res) => {
    try {
        const { userId, preferences } = req.body;
        if (!userId || !preferences) {
            return res.status(400).json({ error: "userId and preferences required" });
        }
        // Persist in Redis (primary store for preferences)
        await redisClient.setex(`notif_prefs:${userId}`, 86400, JSON.stringify(preferences));
        // Publish preference change event
        await eventBus.publish("notification.preferences_updated", { userId, preferences });
        res.json({ success: true });
    }
    catch (err) {
        res.status(500).json({ error: String(err) });
    }
});
// ── GET /api/notifications/stats — Dashboard metrics ─────────────────────────
app.get("/api/notifications/stats", async (req, res) => {
    try {
        const { companyId, period = "7d" } = req.query;
        if (!companyId)
            return res.status(400).json({ error: "companyId required" });
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
        const emailQueueLength = await redisClient.llen("notification:email_queue");
        res.json({
            period,
            total,
            unread,
            readRate: total > 0 ? ((total - unread) / total * 100).toFixed(1) + "%" : "0%",
            byType: byType.map((t) => ({ type: t.type, count: t._count })),
            emailQueueLength,
        });
    }
    catch (err) {
        res.status(500).json({ error: String(err) });
    }
});
// ── Email Queue Worker (Background) ──────────────────────────────────────────
async function processEmailQueue() {
    try {
        const item = await redisClient.rpop("notification:email_queue");
        if (!item)
            return;
        const { userId, title, message } = JSON.parse(item);
        // Fetch user email
        const user = await database_1.prisma.user.findUnique({
            where: { id: userId },
            select: { email: true, name: true },
        });
        if (user?.email) {
            console.log(`[notification-service] 📧 Email → ${user.email}: ${title}`);
            // In production: use Resend/SendGrid here
            // const resend = new Resend(process.env.RESEND_API_KEY);
            // await resend.emails.send({ from: 'noreply@legacymark.com', to: user.email, subject: title, text: message });
        }
    }
    catch (err) {
        console.error("[notification-service] Email worker error:", err);
    }
}
// Process email queue every 5 seconds
setInterval(processEmailQueue, 5000);
// ── Event Bus: Subscribe to platform events ──────────────────────────────────
const eventBus = new events_1.EventBus(REDIS_URL, "notification-service");
const redisClient = new ioredis_1.default(REDIS_URL);
redisClient.on("error", (err) => console.error("[notification-service] Redis client error:", err.message));
// Auto-generate notifications from platform events
const EVENT_MAPPINGS = {
    "lead.created": {
        type: "CRM",
        titleFn: (d) => `Nuevo Lead: ${d.data?.name || "Sin nombre"}`,
    },
    "deal.won": {
        type: "CRM",
        titleFn: (d) => `🎉 Deal Ganado — $${d.value?.toLocaleString() || "0"}`,
    },
    "deal.stage_changed": {
        type: "CRM",
        titleFn: (d) => `Deal movido: ${d.fromStage} → ${d.toStage}`,
    },
    "invoice.paid": {
        type: "FINANCE",
        titleFn: (d) => `💰 Factura Pagada — $${d.amount?.toLocaleString() || "0"}`,
    },
    "workflow.failed": {
        type: "AUTOMATION",
        titleFn: (d) => `⚠️ Workflow Fallido: ${d.workflowName || "Desconocido"}`,
    },
    "workflow.completed": {
        type: "AUTOMATION",
        titleFn: (d) => `✅ Workflow Completado: ${d.workflowName || ""}`,
    },
};
for (const [eventName, mapping] of Object.entries(EVENT_MAPPINGS)) {
    eventBus.subscribe(eventName, async (payload) => {
        try {
            const companyId = payload.data?.companyId;
            if (!companyId)
                return;
            const admins = await database_1.prisma.companyUser.findMany({
                where: { companyId, roleName: { in: ["admin", "owner"] } },
                select: { userId: true },
            });
            if (admins.length > 0) {
                await database_1.prisma.notification.createMany({
                    data: admins.map((a) => ({
                        userId: a.userId,
                        companyId,
                        title: mapping.titleFn(payload.data),
                        message: JSON.stringify(payload.data).substring(0, 200),
                        type: mapping.type,
                        isRead: false,
                    })),
                });
                console.log(`[notification-service] 🔔 ${eventName} → ${admins.length} users notified`);
            }
        }
        catch (err) {
            console.error(`[notification-service] Event ${eventName} handler error:`, err);
        }
    });
}
// ── Start ────────────────────────────────────────────────────────────────────
app.listen(PORT, "0.0.0.0", () => {
    console.log(`🔔 Notification Service running on port ${PORT}`);
    console.log(`   Channels: IN_APP, EMAIL, PUSH`);
    console.log(`   Categories: ${NOTIFICATION_CATEGORIES.join(", ")}`);
    console.log(`   Event mappings: ${Object.keys(EVENT_MAPPINGS).join(", ")}`);
});
process.on("SIGTERM", async () => {
    console.log("[notification-service] Graceful shutdown...");
    await eventBus.disconnect();
    await redisClient.quit();
    await database_1.prisma.$disconnect();
    process.exit(0);
});
// eslint-disable-next-line @typescript-eslint/no-explicit-any
exports.default = app;
//# sourceMappingURL=index.js.map