export enum CircuitState {
  CLOSED = "CLOSED",
  OPEN = "OPEN",
  HALF_OPEN = "HALF_OPEN",
}

export interface CircuitBreakerOptions {
  failureThreshold?: number;
  resetTimeoutMs?: number;
  name?: string;
}

export class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failureCount = 0;
  private lastFailureTime = 0;
  private failureThreshold: number;
  private resetTimeoutMs: number;
  private name: string;

  constructor(options: CircuitBreakerOptions = {}) {
    this.failureThreshold = options.failureThreshold || 3;
    this.resetTimeoutMs = options.resetTimeoutMs || 10000;
    this.name = options.name || "default-breaker";
  }

  public async execute<T>(fn: () => Promise<T>, fallbackFn?: (err: Error) => Promise<T> | T): Promise<T> {
    const now = Date.now();

    // Check if OPEN circuit can transition to HALF_OPEN for probing
    if (this.state === CircuitState.OPEN) {
      if (now - this.lastFailureTime > this.resetTimeoutMs) {
        console.log(`[CircuitBreaker:${this.name}] Transitioning from OPEN to HALF_OPEN probe state.`);
        this.state = CircuitState.HALF_OPEN;
      } else {
        const err = new Error(`[CircuitBreaker:${this.name}] Circuit is OPEN. Request short-circuited.`);
        if (fallbackFn) return await fallbackFn(err);
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
    } catch (err: any) {
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

  public getState(): CircuitState {
    return this.state;
  }
}
