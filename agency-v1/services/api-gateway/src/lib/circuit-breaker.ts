/**
 * Circuit Breaker — API Gateway Resilience
 * ─────────────────────────────────────────────────────────────────────────────
 * Prevents cascading failures when downstream microservices degrade or restart.
 * Tracks failures, transitions states (CLOSED -> OPEN -> HALF-OPEN), and manages cooldowns.
 */
import { Request, Response } from "express";
import { redisClient } from "./redis.singleton";

export class CircuitBreaker {
  public state: "CLOSED" | "OPEN" | "HALF-OPEN" = "CLOSED";
  private failureCount = 0;
  private halfOpenFailures = 0;
  private lastStateChange = Date.now();
  private readonly failureThreshold = 25;
  private readonly cooldownPeriod = 3000; // 3 seconds

  constructor(public readonly serviceName: string) {}

  public checkState(): void {
    if (this.state === "OPEN" && Date.now() - this.lastStateChange > this.cooldownPeriod) {
      this.state = "HALF-OPEN";
      this.halfOpenFailures = 0;
      this.lastStateChange = Date.now();
      console.log(`[CircuitBreaker] Circuit transitioned to HALF-OPEN for ${this.serviceName}`);
    }
  }

  public recordSuccess(): void {
    this.failureCount = 0;
    this.halfOpenFailures = 0;
    if (this.state === "HALF-OPEN" || this.state === "OPEN") {
      this.state = "CLOSED";
      this.lastStateChange = Date.now();
      console.log(`[CircuitBreaker] Circuit transitioned to CLOSED for ${this.serviceName}`);
    }
  }

  public recordFailure(): void {
    this.failureCount++;
    this.lastStateChange = Date.now();
    if (this.state === "HALF-OPEN") {
      this.halfOpenFailures++;
      if (this.halfOpenFailures >= 3) {
        this.state = "OPEN";
        console.warn(`[CircuitBreaker] Circuit transitioned back to OPEN for ${this.serviceName}`);
      }
    } else if (this.failureCount >= this.failureThreshold) {
      this.state = "OPEN";
      console.warn(`[CircuitBreaker] Circuit transitioned to OPEN for ${this.serviceName} due to ${this.failureCount} consecutive failures`);
    }
  }
}

const breakers: Record<string, CircuitBreaker> = {};

export function getBreaker(serviceName: string): CircuitBreaker {
  if (!breakers[serviceName]) {
    breakers[serviceName] = new CircuitBreaker(serviceName);
  }
  return breakers[serviceName];
}

export async function handleCircuitFallback(
  req: Request,
  res: Response,
  serviceName: string,
  reason: string
): Promise<void> {
  if (req.method === "GET") {
    // Attempt fallback from Redis cache if available
    const authHeader = (req.headers.authorization || "").replace("Bearer ", "");
    if (authHeader) {
      const crypto = await import("crypto");
      const hash = crypto.createHash("sha256").update(authHeader).digest("hex").slice(0, 16);
      const cacheKey = `edge_cache:${hash}:${req.path}`;
      try {
        const cached = await redisClient.get(cacheKey);
        if (cached) {
          res.setHeader("X-Cache-Fallback", "HIT");
          res.setHeader("Content-Type", "application/json");
          res.status(200).send(cached);
          return;
        }
      } catch (cacheErr) {
        console.error(`[CircuitBreaker] Fallback cache read error for ${serviceName}:`, cacheErr);
      }
    }
  }

  res.status(503).json({
    success: false,
    error: "Service temporarily degraded",
    service: serviceName,
    reason,
    timestamp: new Date().toISOString(),
  });
}
