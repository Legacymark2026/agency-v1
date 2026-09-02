/**
 * EventBus & Redis Singleton — CRM Service
 * ─────────────────────────────────────────────────────────────────────────────
 * Fixes C-1: Eliminates ReferenceError due to eventBus hoisting by providing
 *            an eagerly initialized, strongly typed eventBus instance.
 * Fixes C-5: Prevents connection pool leaks and collisions by sharing a single
 *            Redis connection instance for Redis Streams & CQRS Read DB.
 */
import { EventBus } from "@agency/events";
import Redis from "ioredis";

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

export const eventBus = new EventBus(REDIS_URL, "crm-service");

export const redisClient = new Redis(REDIS_URL, {
  lazyConnect: true,
  maxRetriesPerRequest: 3,
  retryStrategy: (times) => Math.min(times * 100, 3000),
});

redisClient.on("error", (err) => {
  console.error("[crm-service] Redis client error:", err.message);
});

export async function disconnectEventBusAndRedis(): Promise<void> {
  try {
    await eventBus.disconnect();
  } catch (err) {
    console.warn("[crm-service] Error disconnecting eventBus:", err);
  }
  try {
    redisClient.disconnect();
  } catch (err) {
    console.warn("[crm-service] Error disconnecting redisClient:", err);
  }
}
