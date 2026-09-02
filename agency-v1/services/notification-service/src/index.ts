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

try { require("@agency/observability/register"); } catch { /* optional */ }
import { metricsMiddleware, metricsEndpoint } from "@agency/observability";
import { setupGracefulShutdown } from "@agency/service-auth";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import { prisma } from "@agency/database";
import { EventBus } from "@agency/events";

// Redis & Queue Singletons (Fix C-4)
import { redisClient, disconnectNotificationRedis } from "./lib/redis.singleton";
import { startNotificationWorker } from "./queue/notification.worker";
import { startEmailWorker, stopEmailWorker } from "./workers/email.worker";

// Event Subscriptions (Fix C-5)
import { subscribePlatformEvents } from "./events/notification.events";

// Domain Routers
import { notificationsRouter } from "./routes/notifications.routes";
import { preferencesRouter } from "./routes/preferences.routes";
import { dlqRouter } from "./routes/dlq.routes";
import { statsRouter } from "./routes/stats.routes";
import { errorHandler } from "./middlewares/notification.middleware";

const app = express();
const PORT = parseInt(process.env.PORT || "4016", 10);
const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

// ── Observability & Base Middlewares ──────────────────────────────────────────
app.use(metricsMiddleware("notification-service"));
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(",") || ["http://localhost:3000"],
  credentials: true,
}));
app.use(express.json({ limit: "5mb" }));

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

app.get("/metrics", metricsEndpoint);

app.get("/ready", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    await redisClient.ping();
    res.json({ status: "ready", db: "connected", cache: "connected" });
  } catch (err: any) {
    res.status(503).json({ status: "not_ready", error: err.message });
  }
});

// ── Domain Routers (All protected by requireUserOrServiceAuth) ─────────────────
app.use(notificationsRouter);
app.use(preferencesRouter);
app.use(dlqRouter);
app.use(statsRouter);

// Versioned /api/v1 mounts for seamless backward compatibility
app.use("/api/v1", notificationsRouter);
app.use("/api/v1", preferencesRouter);
app.use("/api/v1", dlqRouter);
app.use("/api/v1", statsRouter);

// ── Centralized Error Handler ────────────────────────────────────────────────
app.use(errorHandler);

// ── Event Bus Subscriptions & Workers ────────────────────────────────────────
const eventBus = new EventBus(REDIS_URL, "notification-service");
subscribePlatformEvents(eventBus);

startNotificationWorker();
startEmailWorker();

// ── Start HTTP Server ────────────────────────────────────────────────────────
const server = app.listen(PORT, "0.0.0.0", () => {
  console.log(`🔔 Notification Service running on port ${PORT}`);
});

setupGracefulShutdown(server, async () => {
  console.log("[notification-service] Shutting down gracefully...");
  stopEmailWorker();
  await eventBus.disconnect().catch(() => {});
  await disconnectNotificationRedis();
  await prisma.$disconnect().catch(() => {});
});

export default app as any;
