"use strict";
/**
 * services/notification-service/src/cache/notification.cache.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Distributed Redis Cache Layer for PostgreSQL Optimization
 *
 * Features:
 *   - unread_count:${userId}:${companyId} → Cached count of unread notifications.
 *   - user_profile:${userId} → Cached user email & name (10 min TTL).
 *   - Real-time cache invalidation on new notification, mark-as-read, or delete.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.redisCache = void 0;
exports.getUnreadCountCached = getUnreadCountCached;
exports.invalidateUnreadCount = invalidateUnreadCount;
exports.getUserProfileCached = getUserProfileCached;
const ioredis_1 = __importDefault(require("ioredis"));
const database_1 = require("@agency/database");
const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";
exports.redisCache = new ioredis_1.default(REDIS_URL);
exports.redisCache.on("error", (err) => {
    console.error("[notification-cache] Redis connection error:", err.message);
});
// ── Unread Count Cache Management ────────────────────────────────────────────
async function getUnreadCountCached(userId, companyId) {
    const cacheKey = `notif:unread_count:${userId}:${companyId}`;
    try {
        const cached = await exports.redisCache.get(cacheKey);
        if (cached !== null) {
            return parseInt(cached, 10);
        }
    }
    catch { }
    // Fallback to PostgreSQL
    const count = await database_1.prisma.notification.count({
        where: { userId, companyId, isRead: false },
    });
    // Cache for 5 minutes (300 seconds)
    try {
        await exports.redisCache.setex(cacheKey, 300, String(count));
    }
    catch { }
    return count;
}
async function invalidateUnreadCount(userId, companyId) {
    try {
        if (companyId) {
            await exports.redisCache.del(`notif:unread_count:${userId}:${companyId}`);
        }
        else {
            const keys = await exports.redisCache.keys(`notif:unread_count:${userId}:*`);
            if (keys.length > 0) {
                await exports.redisCache.del(...keys);
            }
        }
    }
    catch (err) {
        console.error("[notification-cache] Invalidation error:", err.message);
    }
}
async function getUserProfileCached(userId) {
    const cacheKey = `notif:user_profile:${userId}`;
    return database_1.hybridCache.get(cacheKey, async () => {
        return database_1.prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, email: true, name: true },
        });
    }, { ttlL2Seconds: 600 });
}
//# sourceMappingURL=notification.cache.js.map