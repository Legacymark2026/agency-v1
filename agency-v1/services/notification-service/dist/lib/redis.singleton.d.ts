/**
 * Redis Singleton — Notification Service
 * ─────────────────────────────────────────────────────────────────────────────
 * Fix C-4: Consolidates Redis connections across cache, queues, and event streams.
 */
import Redis from "ioredis";
export declare const redisClient: Redis;
export declare const redisBullConnection: Redis;
export declare function disconnectNotificationRedis(): Promise<void>;
//# sourceMappingURL=redis.singleton.d.ts.map