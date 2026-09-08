"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.redisBullConnection = exports.redisClient = void 0;
exports.disconnectNotificationRedis = disconnectNotificationRedis;
/**
 * Redis Singleton — Notification Service
 * ─────────────────────────────────────────────────────────────────────────────
 * Fix C-4: Consolidates Redis connections across cache, queues, and event streams.
 */
const ioredis_1 = __importDefault(require("ioredis"));
const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";
// Standard client for cache, unread counts, and general key-value storage
exports.redisClient = new ioredis_1.default(REDIS_URL, {
    lazyConnect: true,
    maxRetriesPerRequest: 3,
    retryStrategy: (times) => Math.min(times * 100, 3000),
});
exports.redisClient.on("error", (err) => {
    console.error("[notification-service] Redis client error:", err.message);
});
// Dedicated client for BullMQ queues (BullMQ requires maxRetriesPerRequest: null)
exports.redisBullConnection = new ioredis_1.default(REDIS_URL, {
    maxRetriesPerRequest: null,
    lazyConnect: true,
});
exports.redisBullConnection.on("error", (err) => {
    console.error("[notification-service] Redis BullMQ connection error:", err.message);
});
async function disconnectNotificationRedis() {
    try {
        exports.redisClient.disconnect();
    }
    catch (err) {
        console.warn("[notification-service] Error disconnecting redisClient:", err);
    }
    try {
        exports.redisBullConnection.disconnect();
    }
    catch (err) {
        console.warn("[notification-service] Error disconnecting redisBullConnection:", err);
    }
}
//# sourceMappingURL=redis.singleton.js.map