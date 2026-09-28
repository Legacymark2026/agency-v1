"use strict";
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
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
// Redis Singleton (Fix C-3)
const redis_singleton_1 = require("./lib/redis.singleton");
// Domain Routers
const activity_routes_1 = require("./routes/activity.routes");
const metering_routes_1 = require("./routes/metering.routes");
const bi_routes_1 = require("./routes/bi.routes");
const analytics_middleware_1 = require("./middlewares/analytics.middleware");
const app = (0, express_1.default)();
const PORT = parseInt(process.env.PORT || "4013", 10);
// ── Observability & Base Middlewares ──────────────────────────────────────────
app.use((0, observability_1.metricsMiddleware)("analytics-service"));
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)());
app.use(express_1.default.json({ limit: "5mb" }));
// ── Health & Metrics Checks ──────────────────────────────────────────────────
app.get("/health", (_req, res) => {
    res.status(200).json({ status: "healthy", service: "analytics-service", timestamp: new Date().toISOString() });
});
app.get("/metrics", observability_1.metricsEndpoint);
// ── Domain Routers (All protected by requireUserOrServiceAuth) ─────────────────
app.use(activity_routes_1.activityRouter);
app.use(metering_routes_1.meteringRouter);
app.use(bi_routes_1.biRouter);
// Versioned /api/v1 prefix mounts for seamless backward compatibility
app.use("/api/v1", activity_routes_1.activityRouter);
app.use("/api/v1", metering_routes_1.meteringRouter);
app.use("/api/v1", bi_routes_1.biRouter);
// ── Centralized Error Handler ────────────────────────────────────────────────
app.use(analytics_middleware_1.errorHandler);
// ── PostgreSQL Partition Maintenance Helper ──────────────────────────────────
async function runPartitionMaintenance() {
    try {
        const prisma = (0, database_1.getPrismaAnalytics)();
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
      `).catch((err) => console.warn(`[AutoPartition] Notice for ${partUserActivity}:`, err.message));
            const partUsage = `tbl_usage_logs_y${year}m${month}`;
            await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS ${partUsage} PARTITION OF tbl_usage_logs
        FOR VALUES FROM ('${fromStr}') TO ('${toStr}');
      `).catch((err) => console.warn(`[AutoPartition] Notice for ${partUsage}:`, err.message));
        }
        // Ensure tbl_api_usage_logs table exists
        await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS tbl_api_usage_logs (
        id TEXT PRIMARY KEY,
        company_id TEXT NOT NULL,
        api_key_id TEXT NOT NULL,
        service_name TEXT NOT NULL,
        endpoint TEXT NOT NULL,
        method TEXT NOT NULL,
        status_code INTEGER NOT NULL,
        duration_ms INTEGER NOT NULL,
        request_bytes INTEGER DEFAULT 0,
        response_bytes INTEGER DEFAULT 0,
        units_consumed DOUBLE PRECISION DEFAULT 1.0,
        unit_type TEXT DEFAULT 'REQUESTS',
        total_cost_usd DOUBLE PRECISION DEFAULT 0.0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        col_schema_version INTEGER DEFAULT 0,
        col_deleted_at TIMESTAMP WITH TIME ZONE
      )
    `).catch((err) => console.warn("[AutoDDL] Notice for tbl_api_usage_logs:", err.message));
        await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS idx_api_usage_logs_company ON tbl_api_usage_logs(company_id, created_at)`).catch(() => { });
        await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS idx_api_usage_logs_apikey ON tbl_api_usage_logs(api_key_id, created_at)`).catch(() => { });
        await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS idx_api_usage_logs_service ON tbl_api_usage_logs(service_name, created_at)`).catch(() => { });
    }
    catch (err) {
        console.warn("[AutoPartition] Maintenance check skipped or unavailable:", err.message);
    }
}
// ── Start HTTP Server ────────────────────────────────────────────────────────
const server = app.listen(PORT, "0.0.0.0", async () => {
    console.log(`📈 Analytics Service running on port ${PORT}`);
    // Run initial schema & partition check before starting stream worker
    await runPartitionMaintenance().catch(() => { });
    // Start Metered Usage Stream Worker asynchronously
    Promise.resolve().then(() => __importStar(require("./services/metering-aggregator.service"))).then(({ MeteringAggregatorService }) => {
        MeteringAggregatorService.startStreamWorker();
    }).catch((err) => console.error("[StreamWorker] Error starting metering worker:", err.message));
    // Daily partition maintenance
    setInterval(() => {
        runPartitionMaintenance().catch(() => { });
    }, 24 * 60 * 60 * 1000);
});
(0, service_auth_1.setupGracefulShutdown)(server, async () => {
    console.log("[analytics-service] Shutting down gracefully...");
    await (0, redis_singleton_1.disconnectAnalyticsRedis)();
});
exports.default = app;
//# sourceMappingURL=index.js.map