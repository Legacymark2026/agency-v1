/**
 * EventBus & Redis Singleton — AI Engine
 * ─────────────────────────────────────────────────────────────────────────────
 * Fix C-4: Consolidates Redis connections across agent runners, circuit breakers,
 *          and event streams into a single managed client instance.
 */
import { EventBus } from "@agency/events";
import Redis from "ioredis";

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

export const eventBus = new EventBus(REDIS_URL, "ai-engine");

export const redisClient = new Redis(REDIS_URL, {
  lazyConnect: true,
  maxRetriesPerRequest: 3,
  retryStrategy: (times) => Math.min(times * 100, 3000),
});

redisClient.on("error", (err) => {
  console.error("[ai-engine] Redis client error:", err.message);
});

export async function disconnectAiEventBusAndRedis(): Promise<void> {
  try {
    await eventBus.disconnect();
  } catch (err) {
    console.warn("[ai-engine] Error disconnecting eventBus:", err);
  }
  try {
    redisClient.disconnect();
  } catch (err) {
    console.warn("[ai-engine] Error disconnecting redisClient:", err);
  }
}
