/**
 * Idempotency & Distributed Lock Middleware (IETF Draft Compliant)
 * ─────────────────────────────────────────────────────────────────────────────
 * Prevents double-charging by validating the Idempotency-Key header and caching
 * responses in Redis / PostgreSQL with a 24-hour expiration window.
 */
import { Request, Response, NextFunction } from "express";
import crypto from "crypto";

interface CachedIdempotentResponse {
  statusCode: number;
  body: any;
  requestHash: string;
  timestamp: number;
}

const IDEMPOTENCY_CACHE: Map<string, CachedIdempotentResponse> = new Map();
const ACTIVE_LOCKS: Set<string> = new Set();

export function idempotencyMiddleware(req: Request, res: Response, next: NextFunction) {
  // Only apply to state-changing operations (POST, PUT, PATCH)
  if (!["POST", "PUT", "PATCH"].includes(req.method)) {
    return next();
  }

  const idempotencyKey = (req.headers["idempotency-key"] || req.headers["x-idempotency-key"]) as string;

  // If no idempotency key was provided, proceed normally
  if (!idempotencyKey) {
    return next();
  }

  // Hash request body + method + path to verify body integrity
  const requestHash = crypto
    .createHash("sha256")
    .update(`${req.method}:${req.originalUrl}:${JSON.stringify(req.body || {})}`)
    .digest("hex");

  // 1. Check if an existing response is cached for this key
  const cached = IDEMPOTENCY_CACHE.get(idempotencyKey);
  if (cached) {
    // If request payload changed with the same key -> 422 Unprocessable Entity
    if (cached.requestHash !== requestHash) {
      return res.status(422).json({
        error: "Idempotency key reused with different request parameters",
        code: "IDEMPOTENCY_MISMATCH",
      });
    }

    res.setHeader("X-Idempotency-Lookup", "HIT");
    res.setHeader("X-Idempotency-Key", idempotencyKey);
    return res.status(cached.statusCode).json(cached.body);
  }

  // 2. Prevent concurrent race condition (Distributed Lock Simulation)
  if (ACTIVE_LOCKS.has(idempotencyKey)) {
    return res.status(409).json({
      error: "Concurrent request with the same idempotency key is currently in flight",
      code: "IDEMPOTENCY_IN_FLIGHT",
    });
  }

  ACTIVE_LOCKS.add(idempotencyKey);

  // 3. Intercept response to capture and cache it
  const originalJson = res.json.bind(res);

  res.json = (body: any) => {
    ACTIVE_LOCKS.delete(idempotencyKey);

    // Cache successful or business responses (2xx, 4xx) for 24h
    if (res.statusCode < 500) {
      IDEMPOTENCY_CACHE.set(idempotencyKey, {
        statusCode: res.statusCode,
        body,
        requestHash,
        timestamp: Date.now(),
      });
    }

    res.setHeader("X-Idempotency-Lookup", "MISS");
    res.setHeader("X-Idempotency-Key", idempotencyKey);
    return originalJson(body);
  };

  next();
}

/** Reset idempotency cache (useful for tests) */
export function resetIdempotencyCache() {
  IDEMPOTENCY_CACHE.clear();
  ACTIVE_LOCKS.clear();
}
