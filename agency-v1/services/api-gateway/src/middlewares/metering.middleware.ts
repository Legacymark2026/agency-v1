/**
 * Metered Usage & API Monetization Middleware — API Gateway
 * ─────────────────────────────────────────────────────────────────────────────
 * Tracks API usage per company and endpoint, calculating estimated USD costs
 * and pushing events asynchronously to Redis Stream (api_usage_stream).
 */
import { Request, Response, NextFunction } from "express";
import { redisClient } from "../lib/redis.singleton";

export const DEFAULT_API_COST_TABLE: Record<string, { unitType: string; costPerUnitUsd: number }> = {
  "/api/v1/agents":   { unitType: "TOKENS", costPerUnitUsd: 0.0000025 }, // $0.0025 per 1k tokens
  "/api/v1/video":    { unitType: "SECONDS", costPerUnitUsd: 0.05 },      // $0.05 per sec
  "/api/v1/invoices": { unitType: "DOCUMENTS", costPerUnitUsd: 0.08 },   // $0.08 per invoice
  default:            { unitType: "REQUESTS", costPerUnitUsd: 0.0005 },   // $0.0005 per request
};

export let activeApiCostTable = { ...DEFAULT_API_COST_TABLE };

// Load custom pricing from Redis if available
redisClient.get("config:api_pricing").then((cached) => {
  if (cached) {
    try {
      activeApiCostTable = { ...DEFAULT_API_COST_TABLE, ...JSON.parse(cached) };
    } catch {}
  }
}).catch(() => {});

export function apiUsageMeteringMiddleware(req: Request, res: Response, next: NextFunction): void {
  if (!req.path.startsWith("/api/v1") && !req.path.startsWith("/api/agents")) {
    return next();
  }

  const startTime = Date.now();

  res.on("finish", async () => {
    try {
      const companyId = (req.headers["x-company-id"] || "company-default") as string;
      const apiKeyId = (req.headers["x-api-key-id"] || "public-api") as string;
      const durationMs = Date.now() - startTime;

      let matchedConfig = activeApiCostTable["default"];
      for (const prefix of Object.keys(activeApiCostTable)) {
        if (prefix !== "default" && req.path.startsWith(prefix)) {
          matchedConfig = activeApiCostTable[prefix];
          break;
        }
      }

      const unitsHeader = res.getHeader("x-units-consumed");
      const unitsConsumed = unitsHeader ? parseFloat(String(unitsHeader)) : 1.0;
      const totalCostUsd = unitsConsumed * matchedConfig.costPerUnitUsd;

      const eventPayload: Record<string, string> = {
        companyId,
        apiKeyId,
        serviceName: req.path.split("/")[2] || "core",
        endpoint: req.path,
        method: req.method,
        statusCode: String(res.statusCode),
        durationMs: String(durationMs),
        requestBytes: String(req.headers["content-length"] || 0),
        responseBytes: String(res.getHeader("content-length") || 0),
        unitsConsumed: String(unitsConsumed),
        unitType: matchedConfig.unitType,
        totalCostUsd: String(totalCostUsd),
        timestamp: new Date().toISOString(),
      };

      await redisClient.xadd("api_usage_stream", "*", ...Object.entries(eventPayload).flat());
    } catch (err: any) {
      // Non-critical background telemetry
      console.warn("[Metering] Redis Stream push error:", err.message);
    }
  });

  next();
}
