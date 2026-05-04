/**
 * lib/inbox/cache.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Lightweight Upstash REST helper for caching inbox-related keys.
 * Uses the same REST API pattern already present in the repo.
 */

import { logger } from '@/lib/logger';

const URL = process.env.UPSTASH_REDIS_REST_URL;
const TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

function available() {
  return !!URL && !!TOKEN;
}

export async function cacheGet(key: string): Promise<string | null> {
  if (!available()) return null;
  try {
    const res = await fetch(`${URL}/get/${encodeURIComponent(key)}`, {
      headers: { Authorization: `Bearer ${TOKEN}` },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data?.result ?? null;
  } catch (err) {
    logger.warn('[Cache] get failed', { key, err: err instanceof Error ? err.message : String(err) });
    return null;
  }
}

export async function cacheSet(key: string, value: string, exSeconds?: number): Promise<boolean> {
  if (!available()) return false;
  try {
    if (typeof exSeconds === 'number') {
      // Use pipeline SET + EXPIRE for atomic TTL
      const body = JSON.stringify([['SET', key, value, 'EX', exSeconds]]);
      const res = await fetch(`${URL}/pipeline`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
        body,
      });
      return res.ok;
    }

    const res = await fetch(`${URL}/set/${encodeURIComponent(key)}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'text/plain' },
      body: value,
    });

    return res.ok;
  } catch (err) {
    logger.warn('[Cache] set failed', { key, err: err instanceof Error ? err.message : String(err) });
    return false;
  }
}

export async function cacheDel(key: string): Promise<boolean> {
  if (!available()) return false;
  try {
    const body = JSON.stringify([['DEL', key]]);
    const res = await fetch(`${URL}/pipeline`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
      body,
    });
    return res.ok;
  } catch (err) {
    logger.warn('[Cache] del failed', { key, err: err instanceof Error ? err.message : String(err) });
    return false;
  }
}

export default { cacheGet, cacheSet, cacheDel };
