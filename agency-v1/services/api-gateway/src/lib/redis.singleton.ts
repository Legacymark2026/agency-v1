/**
 * Redis Singleton — API Gateway
 * ─────────────────────────────────────────────────────────────────────────────
 * Fix C-3: Consolidates all Redis connections (rate-limiting, cache, metering)
 *          into a single managed client instance with automatic retry strategy.
 */
import Redis from "ioredis";

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

export const redisClient = new Redis(REDIS_URL, {
  lazyConnect: true,
  maxRetriesPerRequest: 3,
  retryStrategy: (times) => Math.min(times * 100, 3000),
});

redisClient.on("error", (err) => {
  console.error("[api-gateway] Redis client error:", err.message);
});

export async function disconnectGatewayRedis(): Promise<void> {
  try {
    redisClient.disconnect();
  } catch (err) {
    console.warn("[api-gateway] Error disconnecting Redis:", err);
  }
}
