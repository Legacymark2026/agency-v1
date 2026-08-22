/**
 * Resilient Cache Client (Redis + In-Memory Fallback)
 * ─────────────────────────────────────────────────────────────────────────────
 * Multi-tier caching client with circuit-breaker capabilities.
 * Automatically falls back to in-memory process cache if Redis is down or slow.
 */

import Redis from "ioredis";

interface CacheEntry {
  value: string;
  expiresAt: number;
}

export class ResilientCacheClient {
  private redis: Redis | null = null;
  private inMemoryCache = new Map<string, CacheEntry>();
  private isRedisHealthy = true;

  constructor(redisUrl?: string) {
    if (redisUrl) {
      try {
        this.redis = new Redis(redisUrl, {
          maxRetriesPerRequest: 1,
          connectTimeout: 500,
          enableOfflineQueue: false,
          retryStrategy: () => null,
          lazyConnect: true,
        });

        this.redis.on("error", (err) => {
          console.warn("[ResilientCache] Redis error detected, engaging in-memory fallback:", err.message);
          this.isRedisHealthy = false;
        });

        this.redis.on("connect", () => {
          console.log("[ResilientCache] Redis connection established.");
          this.isRedisHealthy = true;
        });

        this.redis.connect().catch(() => {
          this.isRedisHealthy = false;
        });
      } catch (e) {
        this.isRedisHealthy = false;
      }
    } else {
      this.isRedisHealthy = false;
    }
  }

  /**
   * Get item from cache with automatic fallback
   */
  async get(key: string): Promise<string | null> {
    // 1. Attempt Redis read if healthy
    if (this.redis && this.isRedisHealthy) {
      try {
        const promise = this.redis.get(key);
        const timeout = new Promise<null>((_, reject) =>
          setTimeout(() => reject(new Error("Redis timeout")), 300)
        );

        const val = (await Promise.race([promise, timeout])) as string | null;
        if (val !== null) return val;
      } catch (e) {
        this.isRedisHealthy = false;
        console.warn(`[ResilientCache] Redis read failed/timed out for key "${key}". Falling back to in-memory cache.`);
      }
    }

    // 2. Fallback to process-level LRU cache
    const entry = this.inMemoryCache.get(key);
    if (entry) {
      if (Date.now() > entry.expiresAt) {
        this.inMemoryCache.delete(key);
        return null;
      }
      return entry.value;
    }

    return null;
  }

  /**
   * Set item in cache (both Redis and process memory)
   */
  async set(key: string, value: string, ttlSeconds = 300): Promise<void> {
    const expiresAt = Date.now() + ttlSeconds * 1000;
    this.inMemoryCache.set(key, { value, expiresAt });

    // Enforce 1000 items max size for in-memory safety
    if (this.inMemoryCache.size > 1000) {
      const firstKey = this.inMemoryCache.keys().next().value;
      if (firstKey) this.inMemoryCache.delete(firstKey);
    }

    if (this.redis && this.isRedisHealthy) {
      try {
        await this.redis.set(key, value, "EX", ttlSeconds);
      } catch (e) {
        this.isRedisHealthy = false;
      }
    }
  }

  /**
   * Delete item from both caches
   */
  async del(key: string): Promise<void> {
    this.inMemoryCache.delete(key);
    if (this.redis && this.isRedisHealthy) {
      try {
        await this.redis.del(key);
      } catch (e) {
        this.isRedisHealthy = false;
      }
    }
  }
}
