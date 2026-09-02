/**
 * Analytics Service — Business Intelligence & Telemetry Microservice
 * ─────────────────────────────────────────────────────────────────────────────
 * Handles: User Activity Logs, Metered Usage Aggregation, Sales Forecasting, BI
 * Port: 4013 (HTTP)
 *
 * Fixes applied in this refactor:
 *   C-1: requireUserOrServiceAuth enforced across all business and telemetry routes
 *   C-2: Strict multi-tenant isolation on logs, metered billing & predictive sales
 *   C-3: Singleton Redis client in lib/redis.singleton.ts with graceful disconnect
 *   C-4: Resilient partition management with proper error boundaries
 *   A-1 & A-2: Refactored into modular domain routers
 */

try { require("@agency/observability/register"); } catch { /* optional */ }
import { metricsMiddleware, metricsEndpoint } from "@agency/observability";
import { setupGracefulShutdown } from "@agency/service-auth";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import { getPrismaAnalytics } from "@agency/database";

// Redis Singleton (Fix C-3)
import { disconnectAnalyticsRedis } from "./lib/redis.singleton";

// Domain Routers
import { activityRouter } from "./routes/activity.routes";
import { meteringRouter } from "./routes/metering.routes";
import { biRouter } from "./routes/bi.routes";
import { errorHandler } from "./middlewares/analytics.middleware";

const app = express();
const PORT = parseInt(process.env.PORT || "4013", 10);

// ── Observability & Base Middlewares ──────────────────────────────────────────
app.use(metricsMiddleware("analytics-service"));
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: "5mb" }));

// ── Health & Metrics Checks ──────────────────────────────────────────────────
app.get("/health", (_req, res) => {
  res.status(200).json({ status: "healthy", service: "analytics-service", timestamp: new Date().toISOString() });
});

app.get("/metrics", metricsEndpoint);

// ── Domain Routers (All protected by requireUserOrServiceAuth) ─────────────────
app.use(activityRouter);
app.use(meteringRouter);
app.use(biRouter);

// Versioned /api/v1 prefix mounts for seamless backward compatibility
app.use("/api/v1", activityRouter);
app.use("/api/v1", meteringRouter);
app.use("/api/v1", biRouter);

// ── Centralized Error Handler ────────────────────────────────────────────────
app.use(errorHandler);

// ── PostgreSQL Partition Maintenance Helper ──────────────────────────────────
async function runPartitionMaintenance(): Promise<void> {
  try {
    const prisma = getPrismaAnalytics();
    const now = new Date();

    for (let i = 0; i <= 1; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");

      const nextD = new Date(year, d.getMonth() + 1, 1);
      const nextYear = nextD.getFullYear();
      const nextMonth = String(nextD.getMonth() + 1).padStart(2, "0");

      const fromStr = `${year}-${month}-01 00:00:00+00`;
      const toStr = `${nextYear}-${nextMonth}-01 00:00:00+00`;

      const partUserActivity = `tbl_user_activity_logs_y${year}m${month}`;
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS ${partUserActivity} PARTITION OF tbl_user_activity_logs
        FOR VALUES FROM ('${fromStr}') TO ('${toStr}');
      `).catch((err: any) => console.warn(`[AutoPartition] Notice for ${partUserActivity}:`, err.message));

      const partUsage = `tbl_usage_logs_y${year}m${month}`;
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS ${partUsage} PARTITION OF tbl_usage_logs
        FOR VALUES FROM ('${fromStr}') TO ('${toStr}');
      `).catch((err: any) => console.warn(`[AutoPartition] Notice for ${partUsage}:`, err.message));
    }
  } catch (err: any) {
    console.warn("[AutoPartition] Maintenance check skipped or unavailable:", err.message);
  }
}

// ── Start HTTP Server ────────────────────────────────────────────────────────
const server = app.listen(PORT, "0.0.0.0", () => {
  console.log(`📈 Analytics Service running on port ${PORT}`);

  // Start Metered Usage Stream Worker asynchronously
  import("./services/metering-aggregator.service").then(({ MeteringAggregatorService }) => {
    MeteringAggregatorService.startStreamWorker();
  }).catch((err) => console.error("[StreamWorker] Error starting metering worker:", err.message));

  // Run initial partition check after 5 seconds delay
  setTimeout(() => {
    runPartitionMaintenance().catch(() => {});
  }, 5000);

  // Daily partition maintenance
  setInterval(() => {
    runPartitionMaintenance().catch(() => {});
  }, 24 * 60 * 60 * 1000);
});

setupGracefulShutdown(server, async () => {
  console.log("[analytics-service] Shutting down gracefully...");
  await disconnectAnalyticsRedis();
});

export default app as any;
