class HybridCache {
  private l1: any = null;
  private l2: any = null;
  private l2Sub: any = null;
  private redisConnected = false;
  private initialized = false;
  private instanceId = Math.random().toString(36).substring(2, 15);
  private pubSubChannel = "hybrid-cache-invalidation";

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
        console.log(`🎒 Hybrid Cache: L2 Redis connected. (Instance: ${this.instanceId})`);
      });

      this.l2.on("error", (err: any) => {
        this.redisConnected = false;
        console.error("🎒 Hybrid Cache: L2 Redis error:", err.message);
      });

      // Setup Subscriber Client
      this.l2Sub = new Redis(redisUrl, {
        maxRetriesPerRequest: 3,
        retryStrategy(times: number) {
          return Math.min(times * 100, 3000);
        },
      });

      this.l2Sub.on("connect", () => {
        console.log(`🎒 Hybrid Cache: L2 Redis Subscriber connected.`);
        this.l2Sub.subscribe(this.pubSubChannel, (err: any) => {
          if (err) {
            console.error("🎒 Hybrid Cache: Failed to subscribe to channel:", err.message);
          } else {
            console.log(`🎒 Hybrid Cache: Subscribed to channel ${this.pubSubChannel}`);
          }
        });
      });

      this.l2Sub.on("message", (channel: string, message: string) => {
        if (channel === this.pubSubChannel) {
          try {
            const payload = JSON.parse(message);
            if (payload && payload.key && payload.origin !== this.instanceId) {
              console.log(`🎒 Hybrid Cache: Invalidating key locally: ${payload.key} (origin: ${payload.origin})`);
              if (this.l1) {
                this.l1.delete(payload.key);
              }
            }
          } catch (err: any) {
            console.error("🎒 Hybrid Cache: Failed to process Pub/Sub invalidation message:", err.message);
          }
        }
      });

      this.l2Sub.on("error", (err: any) => {
        console.error("🎒 Hybrid Cache: L2 Redis Subscriber error:", err.message);
      });
    } catch (err: any) {
      console.error("🎒 Hybrid Cache: Failed to initialize Redis L2 Clients:", err.message);
    }
  }

  /**
   * Helper to serialize and compress large values before writing to Redis.
   */
  private compressValue(value: any): string {
    const stringified = JSON.stringify(value);
    const zlib = require("zlib");
    
    // Compress if payload is larger than 5 KB (5120 characters)
    if (stringified.length > 5120) {
      try {
        const compressedBuffer = zlib.gzipSync(Buffer.from(stringified));
        return JSON.stringify({
          compressed: true,
          data: compressedBuffer.toString("base64")
        });
      } catch (err: any) {
        console.warn("🎒 Hybrid Cache: Failed to compress payload, fallback to plain text:", err.message);
      }
    }
    
    return JSON.stringify({
      compressed: false,
      data: stringified
    });
  }

  /**
   * Helper to decompress and parse values read from Redis.
   */
  private decompressValue(cached: string): any {
    try {
      const payload = JSON.parse(cached);
      
      // Check if it matches the compressed format wrapper
      if (payload && typeof payload === "object" && "compressed" in payload) {
        const zlib = require("zlib");
        if (payload.compressed) {
          const compressedBuffer = Buffer.from(payload.data, "base64");
          const decompressedBuffer = zlib.gunzipSync(compressedBuffer);
          return JSON.parse(decompressedBuffer.toString("utf-8"));
        } else {
          return JSON.parse(payload.data);
        }
      }
      
      // Backward compatibility for raw JSON strings
      return payload;
    } catch (err: any) {
      // Fallback for non-JSON strings or parsing errors
      try {
        return JSON.parse(cached);
      } catch {
        return cached;
      }
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
          const parsed = this.decompressValue(cached);
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
        const compressed = this.compressValue(freshVal);
        await this.l2.set(key, compressed, "EX", ttlL2);
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
        const compressed = this.compressValue(value);
        await this.l2.set(key, compressed, "EX", ttlL2);
        
        // Publish L1 invalidation message to other instances
        await this.l2.publish(
          this.pubSubChannel,
          JSON.stringify({ key, origin: this.instanceId })
        );
      } catch (err: any) {
        console.warn(`🎒 Hybrid Cache: Failed to write and publish L2 (Redis) for key ${key}:`, err.message);
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
        
        // Publish L1 invalidation message to other instances
        await this.l2.publish(
          this.pubSubChannel,
          JSON.stringify({ key, origin: this.instanceId })
        );
      } catch (err: any) {
        console.warn(`🎒 Hybrid Cache: Failed to delete and publish key ${key} from L2:`, err.message);
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
