"use strict";
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
const observability_1 = require("@agency/observability");
const express_1 = __importDefault(require("express"));
// Observability registration — must be first
try {
    require("@agency/observability/register");
}
catch { /* observability optional */ }
const service_auth_1 = require("@agency/service-auth");
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const database_1 = require("@agency/database");
const app = (0, express_1.default)();
app.use((0, observability_1.metricsMiddleware)("analytics-service"));
app.get("/metrics", observability_1.metricsEndpoint);
const port = process.env.PORT || 4013;
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', service: 'analytics-service' });
});
const analytics_routes_1 = require("./routes/analytics.routes");
const analytics_middleware_1 = require("./middlewares/analytics.middleware");
app.use("/api/v1", analytics_routes_1.analyticsRouter);
app.use("/api", analytics_routes_1.analyticsRouter);
app.use("/", analytics_routes_1.analyticsRouter);
app.use(analytics_middleware_1.errorHandler);
async function runPartitionMaintenance() {
    console.log('📅 [AutoPartition] Running log partition check...');
    try {
        const prisma = (0, database_1.getPrismaAnalytics)();
        const now = new Date();
        // Check/create partitions for current month and next month (i = 0 and i = 1)
        for (let i = 0; i <= 1; i++) {
            const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
            const year = d.getFullYear();
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const nextD = new Date(year, d.getMonth() + 1, 1);
            const nextYear = nextD.getFullYear();
            const nextMonth = String(nextD.getMonth() + 1).padStart(2, '0');
            const fromStr = `${year}-${month}-01 00:00:00+00`;
            const toStr = `${nextYear}-${nextMonth}-01 00:00:00+00`;
            // tbl_user_activity_logs partition
            const partUserActivity = `tbl_user_activity_logs_y${year}m${month}`;
            await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS ${partUserActivity} PARTITION OF tbl_user_activity_logs
        FOR VALUES FROM ('${fromStr}') TO ('${toStr}');
      `).catch((err) => console.error(`[AutoPartition] Failed to create partition ${partUserActivity}:`, err.message));
            // tbl_usage_logs partition
            const partUsage = `tbl_usage_logs_y${year}m${month}`;
            await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS ${partUsage} PARTITION OF tbl_usage_logs
        FOR VALUES FROM ('${fromStr}') TO ('${toStr}');
      `).catch((err) => console.error(`[AutoPartition] Failed to create partition ${partUsage}:`, err.message));
        }
        console.log('✅ [AutoPartition] Partition maintenance complete.');
    }
    catch (err) {
        console.error('❌ [AutoPartition] Error checking/creating partitions:', err.message);
    }
}
const server = app.listen(port, () => {
    console.log(`Analytics Service listening at http://localhost:${port}`);
    // Start Metered Usage Stream Worker
    Promise.resolve().then(() => __importStar(require("./services/metering-aggregator.service"))).then(({ MeteringAggregatorService }) => {
        MeteringAggregatorService.startStreamWorker();
    }).catch(err => console.error("Error starting stream worker:", err));
    // Run on startup
    runPartitionMaintenance().catch(err => console.error('Error in startup partition check:', err));
    // Run every 24 hours (86400000 ms)
    setInterval(() => {
        runPartitionMaintenance().catch(err => console.error('Error in cron partition check:', err));
    }, 24 * 60 * 60 * 1000);
});
(0, service_auth_1.setupGracefulShutdown)(server);
//# sourceMappingURL=index.js.map