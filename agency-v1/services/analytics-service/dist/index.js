"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const database_1 = require("@agency/database");
const app = (0, express_1.default)();
const port = process.env.PORT || 4013;
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', service: 'analytics-service' });
});
app.use('/api/analytics', (req, res) => { res.status(200).json({ message: '/api/analytics handled by analytics-service' }); });
app.use('/api/track', (req, res) => { res.status(200).json({ message: '/api/track handled by analytics-service' }); });
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
app.listen(port, () => {
    console.log(`Analytics Service listening at http://localhost:${port}`);
    // Run on startup
    runPartitionMaintenance().catch(err => console.error('Error in startup partition check:', err));
    // Run every 24 hours (86400000 ms)
    setInterval(() => {
        runPartitionMaintenance().catch(err => console.error('Error in cron partition check:', err));
    }, 24 * 60 * 60 * 1000);
});
//# sourceMappingURL=index.js.map