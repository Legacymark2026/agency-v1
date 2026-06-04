declare class HybridCache {
    private l1;
    private l2;
    private redisConnected;
    private initialized;
    private init;
    /**
     * Helper to serialize and compress large values before writing to Redis.
     */
    private compressValue;
    /**
     * Helper to decompress and parse values read from Redis.
     */
    private decompressValue;
    /**
     * Fetches data from cache L1, falling back to L2, and finally to the database/source.
     */
    get<T>(key: string, fetchFn: () => Promise<T>, options?: {
        ttlL1Ms?: number;
        ttlL2Seconds?: number;
    }): Promise<T>;
    /**
     * Set a value explicitly in both L1 and L2 caches.
     */
    set<T>(key: string, value: T, options?: {
        ttlL1Ms?: number;
        ttlL2Seconds?: number;
    }): Promise<void>;
    /**
     * Invalidate a key in both L1 and L2.
     */
    delete(key: string): Promise<void>;
    /**
     * Clear the local L1 cache (in-memory).
     */
    clearLocal(): void;
}
export declare const hybridCache: HybridCache;
export {};
//# sourceMappingURL=cache-helper.d.ts.map