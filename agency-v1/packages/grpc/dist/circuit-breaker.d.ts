/**
 * Circuit Breaker pattern for gRPC and RPC microservice calls.
 * Ensures traffic autonomy and prevents cascade failures across microservices.
 */
export declare enum CircuitState {
    CLOSED = "CLOSED",
    OPEN = "OPEN",
    HALF_OPEN = "HALF_OPEN"
}
export interface CircuitBreakerOptions {
    failureThreshold?: number;
    resetTimeoutMs?: number;
    timeoutMs?: number;
}
export declare class CircuitBreaker {
    private name;
    private state;
    private failureCount;
    private lastStateChange;
    private readonly failureThreshold;
    private readonly resetTimeoutMs;
    private readonly timeoutMs;
    constructor(name: string, options?: CircuitBreakerOptions);
    getState(): CircuitState;
    execute<T>(fn: () => Promise<T>, fallback?: () => T | Promise<T>): Promise<T>;
    private onSuccess;
    private onFailure;
}
