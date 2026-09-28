/**
 * EventBus & Redis Singleton — Auth Service
 * ─────────────────────────────────────────────────────────────────────────────
 * Fixes C-5: Prevents connection leaks and duplicate connections by sharing
 *            a single Redis client instance across token blacklist, rate limiting, and events.
 */
import { EventBus } from "@agency/events";
import Redis from "ioredis";
export declare const eventBus: EventBus;
export declare const redisClient: Redis;
export declare function disconnectAuthEventBusAndRedis(): Promise<void>;
