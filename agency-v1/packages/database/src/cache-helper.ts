class HybridCache {
  private l1: any = null;
  private l2: any = null;
  private redisConnected = false;
  private initialized = false;

  private init() {
    if (this.initialized) return;
    this.initialized = true;

    try {
      const LRUCache = require("lru-cache");
      this.l1 = new LRUCache({
        max: 1000,
        ttl: 1000 * 5, // 5 seconds default TTL
      });
    } catch (err: any) {
      console.error("🎒 Hybrid Cache: Failed to load lru-cache:", err.message);
    }

    try {
      const Redis = require("ioredis");
      const redisUrl = process.env.REDIS_URL || "redis://redis:6379";
      this.l2 = new Redis(redisUrl, {
        maxRetriesPerRequest: 3,
        retryStrategy(times: number) {
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
    this.init();

    // 1. Try L1 (Local memory)
    if (this.l1) {
      const localVal = this.l1.get(key);
      if (localVal !== undefined) {
        return localVal as T;
      }
    }

    // 2. Try L2 (Redis)
    if (this.l2 && this.redisConnected) {
      try {
        const cached = await this.l2.get(key);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (this.l1) {
            this.l1.set(key, parsed, { ttl: options?.ttlL1Ms ?? 1000 * 5 });
          }
          return parsed as T;
        }
      } catch (err: any) {
        console.warn(`🎒 Hybrid Cache: Failed to read from L2 (Redis) for key ${key}:`, err.message);
      }
    }

    // 3. Database fallback (fetchFn)
    const freshVal = await fetchFn();

    // 4. Save back to L1 & L2
    if (this.l1) {
      this.l1.set(key, freshVal, { ttl: options?.ttlL1Ms ?? 1000 * 5 });
    }

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
    this.init();

    if (this.l1) {
      this.l1.set(key, value, { ttl: options?.ttlL1Ms ?? 1000 * 5 });
    }

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
    this.init();

    if (this.l1) {
      this.l1.delete(key);
    }

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
    this.init();
    if (this.l1) {
      this.l1.clear();
    }
  }
}

export const hybridCache = new HybridCache();
