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

import { prisma, hybridCache } from "@agency/database";
import { redisClient as redisCache } from "../lib/redis.singleton";

export { redisCache };

// ── Unread Count Cache Management ────────────────────────────────────────────

export async function getUnreadCountCached(userId: string, companyId: string): Promise<number> {
  const cacheKey = `notif:unread_count:${userId}:${companyId}`;
  try {
    const cached = await redisCache.get(cacheKey);
    if (cached !== null) {
      return parseInt(cached, 10);
    }
  } catch {}

  // Fallback to PostgreSQL
  const count = await prisma.notification.count({
    where: { userId, companyId, isRead: false },
  });

  // Cache for 5 minutes (300 seconds)
  try {
    await redisCache.setex(cacheKey, 300, String(count));
  } catch {}

  return count;
}

export async function invalidateUnreadCount(userId: string, companyId?: string): Promise<void> {
  try {
    if (companyId) {
      await redisCache.del(`notif:unread_count:${userId}:${companyId}`);
    } else {
      const keys = await redisCache.keys(`notif:unread_count:${userId}:*`);
      if (keys.length > 0) {
        await redisCache.del(...keys);
      }
    }
  } catch (err: any) {
    console.error("[notification-cache] Invalidation error:", err.message);
  }
}

// ── User Profile Cache Management (Worker Optimization) ─────────────────────

export interface CachedUserProfile {
  id: string;
  email: string | null;
  name: string | null;
}

export async function getUserProfileCached(userId: string): Promise<CachedUserProfile | null> {
  const cacheKey = `notif:user_profile:${userId}`;
  return hybridCache.get(
    cacheKey,
    async () => {
      return prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, email: true, name: true },
      });
    },
    { ttlL2Seconds: 600 }
  );
}
