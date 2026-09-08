"use strict";
/**
 * Notification Service — Enterprise Notification & Delivery Microservice
 * ─────────────────────────────────────────────────────────────────────────────
 * Centralized notification hub for the entire LegacyMark platform.
 * Handles: In-App, Email (Resend), Push, SMS delivery channels & BullMQ Queues.
 * Port: 4016 (HTTP)
 *
 * Fixes applied in this refactor:
 *   C-1: requireUserOrServiceAuth enforced on all notification endpoints & stats
 *   C-2: Strict multi-tenant isolation on notification listings and dispatches
 *   C-3: High-throughput batch email worker in workers/email.worker.ts
 *   C-4: Redis connection consolidation in lib/redis.singleton.ts
 *   C-5: 32 platform events decoupled into events/notification.events.ts
 *   A-1 & A-2: 961-line God Object refactored into modular domain routers
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
try {
    require("@agency/observability/register");
}
catch { /* optional */ }
const observability_1 = require("@agency/observability");
const service_auth_1 = require("@agency/service-auth");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const database_1 = require("@agency/database");
const events_1 = require("@agency/events");
// Redis & Queue Singletons (Fix C-4)
const redis_singleton_1 = require("./lib/redis.singleton");
const notification_worker_1 = require("./queue/notification.worker");
const email_worker_1 = require("./workers/email.worker");
// Event Subscriptions (Fix C-5)
const notification_events_1 = require("./events/notification.events");
// Domain Routers
const notifications_routes_1 = require("./routes/notifications.routes");
const preferences_routes_1 = require("./routes/preferences.routes");
const dlq_routes_1 = require("./routes/dlq.routes");
const stats_routes_1 = require("./routes/stats.routes");
const notification_middleware_1 = require("./middlewares/notification.middleware");
const app = (0, express_1.default)();
const PORT = parseInt(process.env.PORT || "4016", 10);
const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";
// ── Observability & Base Middlewares ──────────────────────────────────────────
app.use((0, observability_1.metricsMiddleware)("notification-service"));
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: process.env.ALLOWED_ORIGINS?.split(",") || ["http://localhost:3000"],
    credentials: true,
}));
app.use(express_1.default.json({ limit: "5mb" }));
// ── Health & Readiness Checks ────────────────────────────────────────────────
app.get("/health", (_req, res) => {
    res.json({
        status: "healthy",
        service: "notification-service",
        version: "1.0.0",
        timestamp: new Date().toISOString(),
        channels: ["IN_APP", "EMAIL", "PUSH", "SMS"],
    });
});
app.get("/metrics", observability_1.metricsEndpoint);
app.get("/ready", async (_req, res) => {
    try {
        await database_1.prisma.$queryRaw `SELECT 1`;
        await redis_singleton_1.redisClient.ping();
        res.json({ status: "ready", db: "connected", cache: "connected" });
    }
    catch (err) {
        res.status(503).json({ status: "not_ready", error: err.message });
    }
});
// ── Domain Routers (All protected by requireUserOrServiceAuth) ─────────────────
app.use(notifications_routes_1.notificationsRouter);
app.use(preferences_routes_1.preferencesRouter);
app.use(dlq_routes_1.dlqRouter);
app.use(stats_routes_1.statsRouter);
// Versioned /api/v1 mounts for seamless backward compatibility
app.use("/api/v1", notifications_routes_1.notificationsRouter);
app.use("/api/v1", preferences_routes_1.preferencesRouter);
app.use("/api/v1", dlq_routes_1.dlqRouter);
app.use("/api/v1", stats_routes_1.statsRouter);
// ── Centralized Error Handler ────────────────────────────────────────────────
app.use(notification_middleware_1.errorHandler);
// ── Event Bus Subscriptions & Workers ────────────────────────────────────────
const eventBus = new events_1.EventBus(REDIS_URL, "notification-service");
(0, notification_events_1.subscribePlatformEvents)(eventBus);
(0, notification_worker_1.startNotificationWorker)();
(0, email_worker_1.startEmailWorker)();
// ── Start HTTP Server ────────────────────────────────────────────────────────
const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`🔔 Notification Service running on port ${PORT}`);
});
(0, service_auth_1.setupGracefulShutdown)(server, async () => {
    console.log("[notification-service] Shutting down gracefully...");
    (0, email_worker_1.stopEmailWorker)();
    await eventBus.disconnect().catch(() => { });
    await (0, redis_singleton_1.disconnectNotificationRedis)();
    await database_1.prisma.$disconnect().catch(() => { });
});
exports.default = app;
//# sourceMappingURL=index.js.map