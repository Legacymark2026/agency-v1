import LRUCache from "lru-cache";
import Redis from "ioredis";

class HybridCache {
  private l1: LRUCache<string, any>;
  private l2: Redis | null = null;
  private redisConnected = false;

  constructor() {
    // L1 local in-memory cache: max 1000 items, TTL of 5 seconds
    this.l1 = new LRUCache<string, any>({
      max: 1000,
      ttl: 1000 * 5, // 5 seconds default TTL
    });

    // Initialize Redis L2 Cache
    const redisUrl = process.env.REDIS_URL || "redis://redis:6379";
    try {
      this.l2 = new Redis(redisUrl, {
        maxRetriesPerRequest: 3,
        retryStrategy(times) {
          // Retry connecting after a delay, max 3s
          return Math.min(times * 100, 3000);
        },
      });

      this.l2.on("connect", () => {
        this.redisConnected = true;
        console.log("🎒 Hybrid Cache: L2 Redis connected.");
      });

      this.l2.on("error", (err: any) => {
        this.redisConnected = false;
        console.error("🎒 Hybrid Cache: L2 Redis error:", err.message);
      });
    } catch (err: any) {
      console.error("🎒 Hybrid Cache: Failed to initialize Redis L2 Client:", err.message);
    }
  }

  /**
   * Fetches data from cache L1, falling back to L2, and finally to the database/source.
   */
  async get<T>(
    key: string,
    fetchFn: () => Promise<T>,
    options?: { ttlL1Ms?: number; ttlL2Seconds?: number }
  ): Promise<T> {
    // 1. Try L1 (Local memory)
    const localVal = this.l1.get(key);
    if (localVal !== undefined) {
      return localVal as T;
    }

    // 2. Try L2 (Redis)
    if (this.l2 && this.redisConnected) {
      try {
        const cached = await this.l2.get(key);
        if (cached) {
          const parsed = JSON.parse(cached);
          // Save to L1 for next immediate reads
          this.l1.set(key, parsed, { ttl: options?.ttlL1Ms ?? 1000 * 5 });
          return parsed as T;
        }
      } catch (err: any) {
        console.warn(`🎒 Hybrid Cache: Failed to read from L2 (Redis) for key ${key}:`, err.message);
      }
    }

    // 3. Database fallback (fetchFn)
    const freshVal = await fetchFn();

    // 4. Save back to L1 & L2
    this.l1.set(key, freshVal, { ttl: options?.ttlL1Ms ?? 1000 * 5 });

    if (this.l2 && this.redisConnected && freshVal !== undefined && freshVal !== null) {
      try {
        const ttlL2 = options?.ttlL2Seconds ?? 300; // default 5 minutes
        await this.l2.set(key, JSON.stringify(freshVal), "EX", ttlL2);
      } catch (err: any) {
        console.warn(`🎒 Hybrid Cache: Failed to write to L2 (Redis) for key ${key}:`, err.message);
      }
    }

    return freshVal;
  }

  /**
   * Set a value explicitly in both L1 and L2 caches.
   */
  async set<T>(
    key: string,
    value: T,
    options?: { ttlL1Ms?: number; ttlL2Seconds?: number }
  ): Promise<void> {
    this.l1.set(key, value, { ttl: options?.ttlL1Ms ?? 1000 * 5 });

    if (this.l2 && this.redisConnected && value !== undefined && value !== null) {
      try {
        const ttlL2 = options?.ttlL2Seconds ?? 300;
        await this.l2.set(key, JSON.stringify(value), "EX", ttlL2);
      } catch (err: any) {
        console.warn(`🎒 Hybrid Cache: Failed to write to L2 (Redis) for key ${key}:`, err.message);
      }
    }
  }

  /**
   * Invalidate a key in both L1 and L2.
   */
  async delete(key: string): Promise<void> {
    this.l1.delete(key);

    if (this.l2 && this.redisConnected) {
      try {
        await this.l2.del(key);
      } catch (err: any) {
        console.warn(`🎒 Hybrid Cache: Failed to delete key ${key} from L2:`, err.message);
      }
    }
  }

  /**
   * Clear the local L1 cache (in-memory).
   */
  clearLocal(): void {
    this.l1.clear();
  }
}

export const hybridCache = new HybridCache();
