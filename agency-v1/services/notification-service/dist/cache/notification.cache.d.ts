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
import Redis from "ioredis";
export declare const redisCache: Redis;
export declare function getUnreadCountCached(userId: string, companyId: string): Promise<number>;
export declare function invalidateUnreadCount(userId: string, companyId?: string): Promise<void>;
export interface CachedUserProfile {
    id: string;
    email: string | null;
    name: string | null;
}
export declare function getUserProfileCached(userId: string): Promise<CachedUserProfile | null>;
//# sourceMappingURL=notification.cache.d.ts.map