"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hybridCache = void 0;
class HybridCache {
    l1 = null;
    l2 = null;
    redisConnected = false;
    initialized = false;
    init() {
        if (this.initialized)
            return;
        this.initialized = true;
        try {
            const LRUCache = require("lru-cache");
            this.l1 = new LRUCache({
                max: 1000,
                ttl: 1000 * 5, // 5 seconds default TTL
            });
        }
        catch (err) {
            console.error("🎒 Hybrid Cache: Failed to load lru-cache:", err.message);
        }
        try {
            const Redis = require("ioredis");
            const redisUrl = process.env.REDIS_URL || "redis://redis:6379";
            this.l2 = new Redis(redisUrl, {
                maxRetriesPerRequest: 3,
                retryStrategy(times) {
                    return Math.min(times * 100, 3000);
                },
            });
            this.l2.on("connect", () => {
                this.redisConnected = true;
                console.log("🎒 Hybrid Cache: L2 Redis connected.");
            });
            this.l2.on("error", (err) => {
                this.redisConnected = false;
                console.error("🎒 Hybrid Cache: L2 Redis error:", err.message);
            });
        }
        catch (err) {
            console.error("🎒 Hybrid Cache: Failed to initialize Redis L2 Client:", err.message);
        }
    }
    /**
     * Helper to serialize and compress large values before writing to Redis.
     */
    compressValue(value) {
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
            }
            catch (err) {
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
    decompressValue(cached) {
        try {
            const payload = JSON.parse(cached);
            // Check if it matches the compressed format wrapper
            if (payload && typeof payload === "object" && "compressed" in payload) {
                const zlib = require("zlib");
                if (payload.compressed) {
                    const compressedBuffer = Buffer.from(payload.data, "base64");
                    const decompressedBuffer = zlib.gunzipSync(compressedBuffer);
                    return JSON.parse(decompressedBuffer.toString("utf-8"));
                }
                else {
                    return JSON.parse(payload.data);
                }
            }
            // Backward compatibility for raw JSON strings
            return payload;
        }
        catch (err) {
            // Fallback for non-JSON strings or parsing errors
            try {
                return JSON.parse(cached);
            }
            catch {
                return cached;
            }
        }
    }
    /**
     * Fetches data from cache L1, falling back to L2, and finally to the database/source.
     */
    async get(key, fetchFn, options) {
        this.init();
        // 1. Try L1 (Local memory)
        if (this.l1) {
            const localVal = this.l1.get(key);
            if (localVal !== undefined) {
                return localVal;
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
                    return parsed;
                }
            }
            catch (err) {
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
            }
            catch (err) {
                console.warn(`🎒 Hybrid Cache: Failed to write to L2 (Redis) for key ${key}:`, err.message);
            }
        }
        return freshVal;
    }
    /**
     * Set a value explicitly in both L1 and L2 caches.
     */
    async set(key, value, options) {
        this.init();
        if (this.l1) {
            this.l1.set(key, value, { ttl: options?.ttlL1Ms ?? 1000 * 5 });
        }
        if (this.l2 && this.redisConnected && value !== undefined && value !== null) {
            try {
                const ttlL2 = options?.ttlL2Seconds ?? 300;
                const compressed = this.compressValue(value);
                await this.l2.set(key, compressed, "EX", ttlL2);
            }
            catch (err) {
                console.warn(`🎒 Hybrid Cache: Failed to write to L2 (Redis) for key ${key}:`, err.message);
            }
        }
    }
    /**
     * Invalidate a key in both L1 and L2.
     */
    async delete(key) {
        this.init();
        if (this.l1) {
            this.l1.delete(key);
        }
        if (this.l2 && this.redisConnected) {
            try {
                await this.l2.del(key);
            }
            catch (err) {
                console.warn(`🎒 Hybrid Cache: Failed to delete key ${key} from L2:`, err.message);
            }
        }
    }
    /**
     * Clear the local L1 cache (in-memory).
     */
    clearLocal() {
        this.init();
        if (this.l1) {
            this.l1.clear();
        }
    }
}
exports.hybridCache = new HybridCache();
//# sourceMappingURL=cache-helper.js.map