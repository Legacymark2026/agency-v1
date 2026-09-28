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
export declare class TenantRateLimiter {
    private tierLimits;
    private buckets;
    /**
     * Evaluates if a request from a tenant is permitted under their tier rate limit.
     */
    consume(tenantId: string, tier?: SubscriptionTier, cost?: number): RateLimitResult;
}
export declare const tenantRateLimiter: TenantRateLimiter;
//# sourceMappingURL=tenant-rate-limiter.d.ts.map