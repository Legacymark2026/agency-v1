"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CircuitBreaker = exports.CircuitState = void 0;
var CircuitState;
(function (CircuitState) {
    CircuitState["CLOSED"] = "CLOSED";
    CircuitState["OPEN"] = "OPEN";
    CircuitState["HALF_OPEN"] = "HALF_OPEN";
})(CircuitState || (exports.CircuitState = CircuitState = {}));
class CircuitBreaker {
    state = CircuitState.CLOSED;
    failureCount = 0;
    lastFailureTime = 0;
    failureThreshold;
    resetTimeoutMs;
    name;
    constructor(options = {}) {
        this.failureThreshold = options.failureThreshold || 3;
        this.resetTimeoutMs = options.resetTimeoutMs || 10000;
        this.name = options.name || "default-breaker";
    }
    async execute(fn, fallbackFn) {
        const now = Date.now();
        // Check if OPEN circuit can transition to HALF_OPEN for probing
        if (this.state === CircuitState.OPEN) {
            if (now - this.lastFailureTime > this.resetTimeoutMs) {
                console.log(`[CircuitBreaker:${this.name}] Transitioning from OPEN to HALF_OPEN probe state.`);
                this.state = CircuitState.HALF_OPEN;
            }
            else {
                const err = new Error(`[CircuitBreaker:${this.name}] Circuit is OPEN. Request short-circuited.`);
                if (fallbackFn)
                    return await fallbackFn(err);
                throw err;
            }
        }
        try {
            const result = await fn();
            // On success, reset circuit to CLOSED
            if (this.state === CircuitState.HALF_OPEN) {
                console.log(`[CircuitBreaker:${this.name}] Probe succeeded! Resetting circuit to CLOSED.`);
                this.state = CircuitState.CLOSED;
                this.failureCount = 0;
            }
            return result;
        }
        catch (err) {
            this.failureCount++;
            this.lastFailureTime = now;
            if (this.failureCount >= this.failureThreshold) {
                console.warn(`[CircuitBreaker:${this.name}] Failure threshold (${this.failureThreshold}) reached! Opening circuit for ${this.resetTimeoutMs}ms.`);
                this.state = CircuitState.OPEN;
            }
            if (fallbackFn) {
                return await fallbackFn(err instanceof Error ? err : new Error(String(err)));
            }
            throw err;
        }
    }
    getState() {
        return this.state;
    }
}
exports.CircuitBreaker = CircuitBreaker;
//# sourceMappingURL=circuit-breaker.js.map