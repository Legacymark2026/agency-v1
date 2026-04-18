/**
 * lib/asset-cache.ts
 *
 * Simple TTL-based asset cache using Upstash Redis when configured,
 * or an in-process Map as fallback (useful in development).
 *
 * Key schema: asset:{companyId}:{hash(prompt+params)}
 * TTL: 24 hours
 */

import { createHash } from 'crypto';

// ─── IN-PROCESS FALLBACK CACHE ────────────────────────────────────────────────

const memCache = new Map<string, { value: string; expiresAt: number }>();

function memGet(key: string): string | null {
    const entry = memCache.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) { memCache.delete(key); return null; }
    return entry.value;
}

function memSet(key: string, value: string, ttlSeconds: number): void {
    memCache.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });
}

// ─── UPSTASH REDIS CLIENT (lazy) ──────────────────────────────────────────────

type UpstashResult = { result: string | null };

async function redisGet(key: string): Promise<string | null> {
    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;
    if (!url || !token) return null;

    const res = await fetch(`${url}/get/${encodeURIComponent(key)}`, {
        headers: { Authorization: `Bearer ${token}` },
        next: { revalidate: 0 },
    });
    if (!res.ok) return null;
    const data = await res.json() as UpstashResult;
    return data.result ?? null;
}

async function redisSet(key: string, value: string, ttlSeconds: number): Promise<void> {
    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;
    if (!url || !token) return;

    await fetch(`${url}/set/${encodeURIComponent(key)}/${encodeURIComponent(value)}/EX/${ttlSeconds}`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
    });
}

// ─── PUBLIC API ───────────────────────────────────────────────────────────────

const CACHE_TTL = 60 * 60 * 24; // 24 hours

/**
 * Build a deterministic cache key from generation params.
 */
export function buildCacheKey(companyId: string, params: Record<string, unknown>): string {
    const hash = createHash('sha256')
        .update(JSON.stringify(params, Object.keys(params).sort()))
        .digest('hex')
        .slice(0, 16);
    return `asset:${companyId}:${hash}`;
}

/**
 * Get a cached asset URL. Returns null if cache miss.
 */
export async function getCachedAsset(key: string): Promise<string | null> {
    // Try Redis first
    const redisVal = await redisGet(key);
    if (redisVal) return redisVal;

    // Fallback to in-process cache
    return memGet(key);
}

/**
 * Cache an asset URL.
 * @param key   cache key from buildCacheKey()
 * @param url   the blob URL to cache
 */
export async function setCachedAsset(key: string, url: string): Promise<void> {
    // Write to both (Redis as primary, mem as L1)
    memSet(key, url, CACHE_TTL);
    await redisSet(key, url, CACHE_TTL);
}

/**
 * Convenience: check cache, run generator on miss, populate cache.
 */
export async function withAssetCache<T extends { url?: string }>(
    cacheKey: string,
    generator: () => Promise<T>
): Promise<T> {
    const cached = await getCachedAsset(cacheKey);
    if (cached) {
        // Return a synthetic response with cached URL
        return { url: cached } as unknown as T;
    }

    const result = await generator();

    if (result.url) {
        await setCachedAsset(cacheKey, result.url);
    }

    return result;
}
