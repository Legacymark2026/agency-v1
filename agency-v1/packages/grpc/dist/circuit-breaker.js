"use strict";
/**
 * Circuit Breaker pattern for gRPC and RPC microservice calls.
 * Ensures traffic autonomy and prevents cascade failures across microservices.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CircuitBreaker = exports.CircuitState = void 0;
var CircuitState;
(function (CircuitState) {
    CircuitState["CLOSED"] = "CLOSED";
    CircuitState["OPEN"] = "OPEN";
    CircuitState["HALF_OPEN"] = "HALF_OPEN";
})(CircuitState || (exports.CircuitState = CircuitState = {}));
class CircuitBreaker {
    name;
    state = CircuitState.CLOSED;
    failureCount = 0;
    lastStateChange = Date.now();
    failureThreshold;
    resetTimeoutMs;
    timeoutMs;
    constructor(name, options = {}) {
        this.name = name;
        this.failureThreshold = options.failureThreshold ?? 3;
        this.resetTimeoutMs = options.resetTimeoutMs ?? 5000;
        this.timeoutMs = options.timeoutMs ?? 3000;
    }
    getState() {
        if (this.state === CircuitState.OPEN) {
            if (Date.now() - this.lastStateChange > this.resetTimeoutMs) {
                this.state = CircuitState.HALF_OPEN;
                this.lastStateChange = Date.now();
            }
        }
        return this.state;
    }
    async execute(fn, fallback) {
        const currentState = this.getState();
        if (currentState === CircuitState.OPEN) {
            if (fallback) {
                console.warn(`[CircuitBreaker:${this.name}] Circuit OPEN — executing fallback.`);
                return await fallback();
            }
            throw new Error(`[CircuitBreaker:${this.name}] Circuit is OPEN. Request rejected for service autonomy.`);
        }
        try {
            // Wrap call with timeout
            const result = await Promise.race([
                fn(),
                new Promise((_, reject) => setTimeout(() => reject(new Error(`[CircuitBreaker:${this.name}] Call timed out after ${this.timeoutMs}ms`)), this.timeoutMs)),
            ]);
            this.onSuccess();
            return result;
        }
        catch (err) {
            this.onFailure(err);
            if (fallback) {
                console.warn(`[CircuitBreaker:${this.name}] Call failed (${err.message}). Executing fallback.`);
                return await fallback();
            }
            throw err;
        }
    }
    onSuccess() {
        this.failureCount = 0;
        if (this.state === CircuitState.HALF_OPEN) {
            this.state = CircuitState.CLOSED;
            this.lastStateChange = Date.now();
            console.log(`[CircuitBreaker:${this.name}] Service recovered. Circuit state changed to CLOSED.`);
        }
    }
    onFailure(error) {
        this.failureCount++;
        console.error(`[CircuitBreaker:${this.name}] Failure detected (${this.failureCount}/${this.failureThreshold}):`, error.message);
        if (this.failureCount >= this.failureThreshold || this.state === CircuitState.HALF_OPEN) {
            this.state = CircuitState.OPEN;
            this.lastStateChange = Date.now();
            console.error(`[CircuitBreaker:${this.name}] Threshold reached. Circuit state changed to OPEN.`);
        }
    }
}
exports.CircuitBreaker = CircuitBreaker;
