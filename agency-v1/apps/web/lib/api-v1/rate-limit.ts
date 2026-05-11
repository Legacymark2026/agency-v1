/**
 * LegacyMark Public API v1 — In-Memory Rate Limiter
 * ───────────────────────────────────────────────────
 * Sliding window rate limiter keyed by API Key ID.
 * Uses a global Map to persist state across requests
 * within a single serverless function lifetime.
 *
 * Note: For multi-instance/serverless deployments, upgrade to
 * Upstash Redis. This in-memory solution is perfectly fine for
 * single-instance or low-concurrency scenarios on Vercel.
 */

import type { ApiKeyContext } from "./types";
import { RATE_LIMITS } from "./types";
import { apiResponse } from "./response";
import { NextResponse } from "next/server";

interface RateLimitEntry {
    requests:  number;
    windowStart: number;
}

// Global in-memory store: keyId → { requests, windowStart }
const rateLimitStore = new Map<string, RateLimitEntry>();

/**
 * Checks and increments the rate limit counter for a given API key.
 * Returns null if the request is allowed, or a 429 NextResponse if blocked.
 * 
 * Also injects X-RateLimit-* headers into the provided mutable headers map
 * so the final response can include them.
 */
export function checkRateLimit(
    ctx: ApiKeyContext,
    responseHeaders: Record<string, string> = {}
): NextResponse | null {
    const config = RATE_LIMITS[ctx.plan] ?? RATE_LIMITS["free"];
    const now    = Date.now();
    const entry  = rateLimitStore.get(ctx.keyId);

    if (!entry || now - entry.windowStart > config.windowMs) {
        // Start a fresh window
        rateLimitStore.set(ctx.keyId, { requests: 1, windowStart: now });
        const resetAt = new Date(now + config.windowMs);
        appendRateLimitHeaders(responseHeaders, config.requests, config.requests - 1, resetAt);
        return null;
    }

    if (entry.requests >= config.requests) {
        const resetAt = new Date(entry.windowStart + config.windowMs);
        return apiResponse.rateLimited(config.requests, resetAt);
    }

    // Increment
    entry.requests++;
    rateLimitStore.set(ctx.keyId, entry);
    const resetAt = new Date(entry.windowStart + config.windowMs);
    appendRateLimitHeaders(responseHeaders, config.requests, config.requests - entry.requests, resetAt);
    return null;
}

function appendRateLimitHeaders(
    headers: Record<string, string>,
    limit: number,
    remaining: number,
    resetAt: Date
) {
    headers["X-RateLimit-Limit"]     = String(limit);
    headers["X-RateLimit-Remaining"] = String(Math.max(0, remaining));
    headers["X-RateLimit-Reset"]     = String(Math.ceil(resetAt.getTime() / 1000));
}
