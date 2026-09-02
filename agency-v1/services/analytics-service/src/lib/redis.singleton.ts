/**
 * Redis Singleton — Analytics Service
 * ─────────────────────────────────────────────────────────────────────────────
 * Manages the Redis connection for consuming the api_usage_stream and caching
 * analytics aggregations with retry strategies and graceful shutdown.
 */
import Redis from "ioredis";

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

export const redisClient = new Redis(REDIS_URL, {
  lazyConnect: true,
  maxRetriesPerRequest: 3,
  retryStrategy: (times) => Math.min(times * 100, 3000),
});

redisClient.on("error", (err) => {
  console.error("[analytics-service] Redis client error:", err.message);
});

export async function disconnectAnalyticsRedis(): Promise<void> {
  try {
    redisClient.disconnect();
  } catch (err) {
    console.warn("[analytics-service] Error disconnecting Redis:", err);
  }
}
