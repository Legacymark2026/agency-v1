import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { getPrismaAnalytics } from '@agency/database';

const app = express();
const port = process.env.PORT || 4013;

app.use(helmet());
app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'analytics-service' });
});

import { analyticsRouter } from "./routes/analytics.routes";
import { errorHandler } from "./middlewares/analytics.middleware";

app.use("/api", analyticsRouter);
app.use(errorHandler);

async function runPartitionMaintenance() {
  console.log('📅 [AutoPartition] Running log partition check...');
  try {
    const prisma = getPrismaAnalytics();
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
      `).catch((err: any) => console.error(`[AutoPartition] Failed to create partition ${partUserActivity}:`, err.message));
      
      // tbl_usage_logs partition
      const partUsage = `tbl_usage_logs_y${year}m${month}`;
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS ${partUsage} PARTITION OF tbl_usage_logs
        FOR VALUES FROM ('${fromStr}') TO ('${toStr}');
      `).catch((err: any) => console.error(`[AutoPartition] Failed to create partition ${partUsage}:`, err.message));
    }
    console.log('✅ [AutoPartition] Partition maintenance complete.');
  } catch (err: any) {
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
