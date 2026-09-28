/**
 * Redis Singleton — Analytics Service
 * ─────────────────────────────────────────────────────────────────────────────
 * Manages the Redis connection for consuming the api_usage_stream and caching
 * analytics aggregations with retry strategies and graceful shutdown.
 */
import Redis from "ioredis";
export declare const redisClient: Redis;
export declare function disconnectAnalyticsRedis(): Promise<void>;
