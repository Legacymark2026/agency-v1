export declare enum CircuitState {
    CLOSED = "CLOSED",
    OPEN = "OPEN",
    HALF_OPEN = "HALF_OPEN"
}
export interface CircuitBreakerOptions {
    failureThreshold?: number;
    resetTimeoutMs?: number;
    name?: string;
}
export declare class CircuitBreaker {
    private state;
    private failureCount;
    private lastFailureTime;
    private failureThreshold;
    private resetTimeoutMs;
    private name;
    constructor(options?: CircuitBreakerOptions);
    execute<T>(fn: () => Promise<T>, fallbackFn?: (err: Error) => Promise<T> | T): Promise<T>;
    getState(): CircuitState;
}
//# sourceMappingURL=circuit-breaker.d.ts.map