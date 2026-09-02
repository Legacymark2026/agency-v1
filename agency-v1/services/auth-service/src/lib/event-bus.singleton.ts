/**
 * EventBus & Redis Singleton — Auth Service
 * ─────────────────────────────────────────────────────────────────────────────
 * Fixes C-5: Prevents connection leaks and duplicate connections by sharing
 *            a single Redis client instance across token blacklist, rate limiting, and events.
 */
import { EventBus } from "@agency/events";
import Redis from "ioredis";

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

export const eventBus = new EventBus(REDIS_URL, "auth-service");

export const redisClient = new Redis(REDIS_URL, {
  lazyConnect: true,
  maxRetriesPerRequest: 3,
  retryStrategy: (times) => Math.min(times * 100, 3000),
});

redisClient.on("error", (err) => {
  console.error("[auth-service] Redis client error:", err.message);
});

export async function disconnectAuthEventBusAndRedis(): Promise<void> {
  try {
    await eventBus.disconnect();
  } catch (err) {
    console.warn("[auth-service] Error disconnecting eventBus:", err);
  }
  try {
    redisClient.disconnect();
  } catch (err) {
    console.warn("[auth-service] Error disconnecting redisClient:", err);
  }
}
