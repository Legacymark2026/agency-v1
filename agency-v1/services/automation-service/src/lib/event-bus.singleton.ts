/**
 * EventBus & Redis Singleton — Automation Service
 * ─────────────────────────────────────────────────────────────────────────────
 * Fix C-5: Manages a single shared Redis connection and EventBus instance
 *          with automatic retries and graceful shutdown handlers.
 */
import { EventBus } from "@agency/events";
import Redis from "ioredis";

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

export const eventBus = new EventBus(REDIS_URL, "automation-service");

export const redisClient = new Redis(REDIS_URL, {
  lazyConnect: true,
  maxRetriesPerRequest: 3,
  retryStrategy: (times) => Math.min(times * 100, 3000),
});

redisClient.on("error", (err) => {
  console.error("[automation-service] Redis client error:", err.message);
});

export async function disconnectAutomationEventBusAndRedis(): Promise<void> {
  try {
    await eventBus.disconnect();
  } catch (err) {
    console.warn("[automation-service] Error disconnecting eventBus:", err);
  }
  try {
    redisClient.disconnect();
  } catch (err) {
    console.warn("[automation-service] Error disconnecting redisClient:", err);
  }
}
