/**
 * Resilient Cache Client (Redis + In-Memory Fallback)
 * ─────────────────────────────────────────────────────────────────────────────
 * Multi-tier caching client with circuit-breaker capabilities.
 * Automatically falls back to in-memory process cache if Redis is down or slow.
 */
export declare class ResilientCacheClient {
    private redis;
    private inMemoryCache;
    private isRedisHealthy;
    constructor(redisUrl?: string);
    /**
     * Get item from cache with automatic fallback
     */
    get(key: string): Promise<string | null>;
    /**
     * Set item in cache (both Redis and process memory)
     */
    set(key: string, value: string, ttlSeconds?: number): Promise<void>;
    /**
     * Delete item from both caches
     */
    del(key: string): Promise<void>;
}
//# sourceMappingURL=resilient-cache-client.d.ts.map