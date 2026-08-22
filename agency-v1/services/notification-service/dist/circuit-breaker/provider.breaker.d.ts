/**
 * services/notification-service/src/circuit-breaker/provider.breaker.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Resilient Circuit Breaker Implementation for External Delivery Providers.
 * Protects against external service outages (Resend Email API, Twilio, WebPush).
 *
 * States:
 *   CLOSED   → Normal operation (requests pass through)
 *   OPEN     → Provider outage detected (>50% errors). Requests fail-fast / re-queue
 *   HALF_OPEN → Test mode after 30s to verify provider recovery
 */
export interface CircuitBreakerOptions {
    timeoutMs?: number;
    failureThresholdPercentage?: number;
    resetTimeoutMs?: number;
    minRequests?: number;
}
export declare class CircuitBreaker<T, R> {
    private fn;
    private state;
    private failureCount;
    private successCount;
    private totalCount;
    private nextAttempt;
    private options;
    constructor(fn: (arg: T) => Promise<R>, options?: CircuitBreakerOptions);
    fire(arg: T): Promise<R>;
    private onSuccess;
    private onFailure;
    private reset;
    getState(): "CLOSED" | "OPEN" | "HALF_OPEN";
}
export declare const emailCircuitBreaker: CircuitBreaker<{
    to: string;
    subject: string;
    html: string;
}, {
    success: boolean;
    id: string;
}>;
export declare const pushCircuitBreaker: CircuitBreaker<{
    userId: string;
    title: string;
    message: string;
}, {
    success: boolean;
}>;
//# sourceMappingURL=provider.breaker.d.ts.map