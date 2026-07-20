/**
 * Circuit Breaker pattern for gRPC and RPC microservice calls.
 * Ensures traffic autonomy and prevents cascade failures across microservices.
 */

export enum CircuitState {
  CLOSED = "CLOSED",
  OPEN = "OPEN",
  HALF_OPEN = "HALF_OPEN",
}

export interface CircuitBreakerOptions {
  failureThreshold?: number; // Number of failures before opening circuit (default: 3)
  resetTimeoutMs?: number;   // Time in ms before testing service recovery (default: 5000ms)
  timeoutMs?: number;        // Call timeout in ms (default: 3000ms)
}

export class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failureCount: number = 0;
  private lastStateChange: number = Date.now();
  private readonly failureThreshold: number;
  private readonly resetTimeoutMs: number;
  private readonly timeoutMs: number;

  constructor(private name: string, options: CircuitBreakerOptions = {}) {
    this.failureThreshold = options.failureThreshold ?? 3;
    this.resetTimeoutMs = options.resetTimeoutMs ?? 5000;
    this.timeoutMs = options.timeoutMs ?? 3000;
  }

  public getState(): CircuitState {
    if (this.state === CircuitState.OPEN) {
      if (Date.now() - this.lastStateChange > this.resetTimeoutMs) {
        this.state = CircuitState.HALF_OPEN;
        this.lastStateChange = Date.now();
      }
    }
    return this.state;
  }

  public async execute<T>(fn: () => Promise<T>, fallback?: () => T | Promise<T>): Promise<T> {
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
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error(`[CircuitBreaker:${this.name}] Call timed out after ${this.timeoutMs}ms`)), this.timeoutMs)
        ),
      ]);

      this.onSuccess();
      return result;
    } catch (err: any) {
      this.onFailure(err);
      if (fallback) {
        console.warn(`[CircuitBreaker:${this.name}] Call failed (${err.message}). Executing fallback.`);
        return await fallback();
      }
      throw err;
    }
  }

  private onSuccess() {
    this.failureCount = 0;
    if (this.state === CircuitState.HALF_OPEN) {
      this.state = CircuitState.CLOSED;
      this.lastStateChange = Date.now();
      console.log(`[CircuitBreaker:${this.name}] Service recovered. Circuit state changed to CLOSED.`);
    }
  }

  private onFailure(error: any) {
    this.failureCount++;
    console.error(`[CircuitBreaker:${this.name}] Failure detected (${this.failureCount}/${this.failureThreshold}):`, error.message);

    if (this.failureCount >= this.failureThreshold || this.state === CircuitState.HALF_OPEN) {
      this.state = CircuitState.OPEN;
      this.lastStateChange = Date.now();
      console.error(`[CircuitBreaker:${this.name}] Threshold reached. Circuit state changed to OPEN.`);
    }
  }
}
