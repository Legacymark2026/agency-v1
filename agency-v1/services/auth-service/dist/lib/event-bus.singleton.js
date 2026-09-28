"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.redisClient = exports.eventBus = void 0;
exports.disconnectAuthEventBusAndRedis = disconnectAuthEventBusAndRedis;
/**
 * EventBus & Redis Singleton — Auth Service
 * ─────────────────────────────────────────────────────────────────────────────
 * Fixes C-5: Prevents connection leaks and duplicate connections by sharing
 *            a single Redis client instance across token blacklist, rate limiting, and events.
 */
const events_1 = require("@agency/events");
const ioredis_1 = __importDefault(require("ioredis"));
const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";
exports.eventBus = new events_1.EventBus(REDIS_URL, "auth-service");
exports.redisClient = new ioredis_1.default(REDIS_URL, {
    lazyConnect: true,
    maxRetriesPerRequest: 3,
    retryStrategy: (times) => Math.min(times * 100, 3000),
});
exports.redisClient.on("error", (err) => {
    console.error("[auth-service] Redis client error:", err.message);
});
async function disconnectAuthEventBusAndRedis() {
    try {
        await exports.eventBus.disconnect();
    }
    catch (err) {
        console.warn("[auth-service] Error disconnecting eventBus:", err);
    }
    try {
        exports.redisClient.disconnect();
    }
    catch (err) {
        console.warn("[auth-service] Error disconnecting redisClient:", err);
    }
}
//# sourceMappingURL=event-bus.singleton.js.map