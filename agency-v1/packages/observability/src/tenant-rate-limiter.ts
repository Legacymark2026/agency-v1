/**
 * Dynamic Multi-Tenant Rate Limiter (Token Bucket Algorithm)
 * ─────────────────────────────────────────────────────────────────────────────
 * Enforces differentiated API quotas based on tenant subscription tier:
 * - FREE: 30 requests / minute
 * - PRO: 300 requests / minute
 * - ENTERPRISE: 2000 requests / minute
 */

export type SubscriptionTier = "FREE" | "PRO" | "ENTERPRISE";

export interface RateLimitResult {
  isAllowed: boolean;
  remainingTokens: number;
  limit: number;
  resetTimeSec: number;
  retryAfterSec?: number;
}

export class TenantRateLimiter {
  private tierLimits: Record<SubscriptionTier, { capacity: number; refillRatePerSec: number }> = {
    FREE: { capacity: 30, refillRatePerSec: 0.5 }, // 30 req/min
    PRO: { capacity: 300, refillRatePerSec: 5.0 }, // 300 req/min
    ENTERPRISE: { capacity: 2000, refillRatePerSec: 33.3 }, // 2000 req/min
  };

  private buckets = new Map<string, { tokens: number; lastRefill: number }>();

  /**
   * Evaluates if a request from a tenant is permitted under their tier rate limit.
   */
  public consume(tenantId: string, tier: SubscriptionTier = "PRO", cost = 1): RateLimitResult {
    const config = this.tierLimits[tier] || this.tierLimits.PRO;
    const now = Date.now();

    let bucket = this.buckets.get(tenantId);
    if (!bucket) {
      bucket = { tokens: config.capacity, lastRefill: now };
      this.buckets.set(tenantId, bucket);
    }

    // Refill tokens based on elapsed time
    const elapsedSec = (now - bucket.lastRefill) / 1000;
    bucket.tokens = Math.min(config.capacity, bucket.tokens + elapsedSec * config.refillRatePerSec);
    bucket.lastRefill = now;

    if (bucket.tokens >= cost) {
      bucket.tokens -= cost;
      return {
        isAllowed: true,
        remainingTokens: Math.floor(bucket.tokens),
        limit: config.capacity,
        resetTimeSec: Math.ceil((config.capacity - bucket.tokens) / config.refillRatePerSec),
      };
    }

    const missingTokens = cost - bucket.tokens;
    const retryAfterSec = Math.ceil(missingTokens / config.refillRatePerSec);

    return {
      isAllowed: false,
      remainingTokens: 0,
      limit: config.capacity,
      resetTimeSec: retryAfterSec,
      retryAfterSec,
    };
  }
}

export const tenantRateLimiter = new TenantRateLimiter();
