import Redis from "ioredis";
import { getPrismaAnalytics } from "@agency/database";

const REDIS_URL = process.env.REDIS_URL || "redis://redis:6379";
let redis: Redis | null = null;

try {
  redis = new Redis(REDIS_URL, { maxRetriesPerRequest: 3 });
  redis.on("error", (err) => console.warn("[MeteringAggregator] Redis warning:", err.message));
} catch (err) {
  console.warn("[MeteringAggregator] Redis init warning:", err);
}

export class MeteringAggregatorService {
  /**
   * Obtiene estadísticas agregadas de consumo de API por empresa
   */
  static async getCompanyUsageStats(companyId: string, days = 30) {
    const prisma = getPrismaAnalytics();
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    try {
      const logs = await (prisma as any).apiUsageLog.findMany({
        where: { companyId, createdAt: { gte: since } },
        orderBy: { createdAt: "desc" },
        take: 500
      });

      const totalRequests = logs.length;
      const totalCostUsd = logs.reduce((sum: number, l: any) => sum + (l.totalCostUsd || 0), 0);
      const avgDurationMs = totalRequests > 0
        ? Math.round(logs.reduce((sum: number, l: any) => sum + (l.durationMs || 0), 0) / totalRequests)
        : 0;

      // Group by service
      const byService: Record<string, { requests: number; costUsd: number }> = {};
      for (const log of logs) {
        const s = log.serviceName || "core";
        if (!byService[s]) byService[s] = { requests: 0, costUsd: 0 };
        byService[s].requests++;
        byService[s].costUsd += log.totalCostUsd || 0;
      }

      return {
        totalRequests,
        totalCostUsd: Number(totalCostUsd.toFixed(4)),
        avgDurationMs,
        byService,
        recentLogs: logs.slice(0, 50)
      };
    } catch (err: any) {
      console.warn("[MeteringAggregator] DB error:", err.message);
      return { totalRequests: 0, totalCostUsd: 0, avgDurationMs: 0, byService: {}, recentLogs: [] };
    }
  }

  /**
   * Obtiene datos de consumo por serie de tiempo (por hora/día) para gráficos de UI
   */
  static async getCompanyUsageTimeSeries(companyId: string) {
    const stats = await this.getCompanyUsageStats(companyId, 7);
    return stats;
  }

  /**
   * Inicia el Worker consumidor de Redis Streams para procesamiento en batch
   */
  static startStreamWorker() {
    if (!redis) return;
    console.log("⚡ [MeteringAggregator] Stream Worker iniciado en api_usage_stream");

    setInterval(async () => {
      if (!redis || redis.status !== "ready") return;
      try {
        const entries = await redis.xread("COUNT", 100, "STREAMS", "api_usage_stream", "0");
        if (!entries || entries.length === 0) return;

        const prisma = getPrismaAnalytics();
        const streamData = entries[0][1];
        if (!streamData || streamData.length === 0) return;

        const recordsToInsert: any[] = [];
        const idsToDelete: string[] = [];

        for (const [id, fields] of streamData) {
          idsToDelete.push(id);
          const kv: Record<string, string> = {};
          for (let i = 0; i < fields.length; i += 2) {
            kv[fields[i]] = fields[i + 1];
          }

          recordsToInsert.push({
            companyId: kv.companyId || "company-default",
            apiKeyId: kv.apiKeyId || "public-api",
            serviceName: kv.serviceName || "core",
            endpoint: kv.endpoint || "/api/v1",
            method: kv.method || "GET",
            statusCode: parseInt(kv.statusCode || "200", 10),
            durationMs: parseInt(kv.durationMs || "0", 10),
            requestBytes: parseInt(kv.requestBytes || "0", 10),
            responseBytes: parseInt(kv.responseBytes || "0", 10),
            unitsConsumed: parseFloat(kv.unitsConsumed || "1.0"),
            unitType: kv.unitType || "REQUESTS",
            totalCostUsd: parseFloat(kv.totalCostUsd || "0.0"),
            createdAt: kv.timestamp ? new Date(kv.timestamp) : new Date(),
          });
        }

        if (recordsToInsert.length > 0) {
          await (prisma as any).apiUsageLog.createMany({ data: recordsToInsert, skipDuplicates: true });
          await redis.xdel("api_usage_stream", ...idsToDelete);
        }
      } catch (err: any) {
        console.warn("[MeteringAggregator] Stream Worker cycle notice:", err.message);
      }
    }, 3000);
  }
}
