"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.redisClient = void 0;
exports.disconnectAnalyticsRedis = disconnectAnalyticsRedis;
/**
 * Redis Singleton — Analytics Service
 * ─────────────────────────────────────────────────────────────────────────────
 * Manages the Redis connection for consuming the api_usage_stream and caching
 * analytics aggregations with retry strategies and graceful shutdown.
 */
const ioredis_1 = __importDefault(require("ioredis"));
const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";
exports.redisClient = new ioredis_1.default(REDIS_URL, {
    lazyConnect: true,
    maxRetriesPerRequest: 3,
    retryStrategy: (times) => Math.min(times * 100, 3000),
});
exports.redisClient.on("error", (err) => {
    console.error("[analytics-service] Redis client error:", err.message);
});
async function disconnectAnalyticsRedis() {
    try {
        exports.redisClient.disconnect();
    }
    catch (err) {
        console.warn("[analytics-service] Error disconnecting Redis:", err);
    }
}
//# sourceMappingURL=redis.singleton.js.map