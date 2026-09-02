/**
 * Redis Singleton — Notification Service
 * ─────────────────────────────────────────────────────────────────────────────
 * Fix C-4: Consolidates Redis connections across cache, queues, and event streams.
 */
import Redis from "ioredis";

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

// Standard client for cache, unread counts, and general key-value storage
export const redisClient = new Redis(REDIS_URL, {
  lazyConnect: true,
  maxRetriesPerRequest: 3,
  retryStrategy: (times) => Math.min(times * 100, 3000),
});

redisClient.on("error", (err) => {
  console.error("[notification-service] Redis client error:", err.message);
});

// Dedicated client for BullMQ queues (BullMQ requires maxRetriesPerRequest: null)
export const redisBullConnection = new Redis(REDIS_URL, {
  maxRetriesPerRequest: null,
  lazyConnect: true,
});

redisBullConnection.on("error", (err) => {
  console.error("[notification-service] Redis BullMQ connection error:", err.message);
});

export async function disconnectNotificationRedis(): Promise<void> {
  try {
    redisClient.disconnect();
  } catch (err) {
    console.warn("[notification-service] Error disconnecting redisClient:", err);
  }
  try {
    redisBullConnection.disconnect();
  } catch (err) {
    console.warn("[notification-service] Error disconnecting redisBullConnection:", err);
  }
}
