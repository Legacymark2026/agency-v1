/**
 * @agency/service-auth
 * ─────────────────────────────────────────────────────────────────────────────
 * Inter-service JWT authentication package for LegacyMark microservices.
 *
 * Provides:
 *  - signServiceToken()        — Sign a short-lived JWT for inter-service calls
 *  - verifyServiceToken()      — Verify and decode a service JWT
 *  - requireServiceAuth        — Express middleware: enforce service JWT
 *  - requireUserOrServiceAuth  — Express middleware: accept user JWT OR service JWT
 *  - idempotencyMiddleware      — Express middleware: enforce Idempotency-Key on POST
 *
 * Usage:
 *  import { requireServiceAuth, signServiceToken } from '@agency/service-auth';
 *
 *  // In a service calling another service:
 *  const token = signServiceToken('crm-service', 'crm-service', ['read:leads']);
 *  fetch('http://notification-service/api/v1/notifications', {
 *    headers: { 'x-service-token': token }
 *  });
 *
 *  // In the target service's router:
 *  router.post('/internal/notify', requireServiceAuth, controller.notify);
 */

import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import { ServiceTokenPayload, ServiceAuthContext } from "./types";

// ── Configuration ─────────────────────────────────────────────────────────────
function resolveServiceJwtSecret(): string {
  const secret = process.env.SERVICE_JWT_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "[FATAL SECURITY ERROR] SERVICE_JWT_SECRET environment variable is missing in production. Refusing to start with insecure fallback."
      );
    }
    return "legacymark-dev-ephemeral-service-secret-32-chars-minimum";
  }
  return secret;
}

const SERVICE_TOKEN_EXPIRY = "5m"; // Short-lived for security

// ── Token Operations ──────────────────────────────────────────────────────────

/**
 * Signs a short-lived JWT for inter-service communication.
 * Each service should sign its own token before calling another service.
 *
 * @param serviceId    — Unique identifier for the calling service (e.g. 'crm-service')
 * @param serviceName  — Human-readable name (e.g. 'CRM Service')
 * @param permissions  — List of permissions (default: ['*'] = all)
 */
export const signServiceToken = (
  serviceId: string,
  serviceName: string,
  permissions: string[] = ["*"]
): string => {
  return jwt.sign(
    { serviceId, serviceName, permissions } satisfies Omit<ServiceTokenPayload, "iat" | "exp">,
    resolveServiceJwtSecret(),
    { expiresIn: SERVICE_TOKEN_EXPIRY, issuer: "legacymark-services" }
  );
};

/**
 * Verifies and decodes a service JWT.
 * Throws if the token is invalid or expired.
 */
export const verifyServiceToken = (token: string): ServiceTokenPayload => {
  return jwt.verify(token, resolveServiceJwtSecret(), {
    issuer: "legacymark-services",
  }) as ServiceTokenPayload;
};

// ── Express Middlewares ────────────────────────────────────────────────────────

/**
 * Middleware: Requires a valid x-service-token header.
 * Use on routes that are ONLY called by other internal services.
 */
export const requireServiceAuth = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const token = req.headers["x-service-token"] as string | undefined;

  if (!token) {
    res.status(401).json({
      success: false,
      error: "Missing x-service-token header",
      code: "SERVICE_AUTH_REQUIRED",
    });
    return;
  }

  try {
    const payload = verifyServiceToken(token);
    req.serviceContext = {
      serviceId: payload.serviceId,
      serviceName: payload.serviceName,
      permissions: payload.permissions,
    } satisfies ServiceAuthContext;
    next();
  } catch {
    res.status(401).json({
      success: false,
      error: "Invalid or expired service token",
      code: "SERVICE_AUTH_INVALID",
    });
  }
};

/**
 * Middleware: Accepts EITHER a valid x-service-token OR a forwarded user context
 * (x-user-id set by the api-gateway after JWT validation).
 * Use on routes accessible both by end-users (via gateway) and internal services.
 */
export const requireUserOrServiceAuth = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const serviceToken = req.headers["x-service-token"] as string | undefined;
  const userId = req.headers["x-user-id"] as string | undefined;

  // Option A: Service-to-service call
  if (serviceToken) {
    try {
      const payload = verifyServiceToken(serviceToken);
      req.serviceContext = {
        serviceId: payload.serviceId,
        serviceName: payload.serviceName,
        permissions: payload.permissions,
      };
      return next();
    } catch {
      // Invalid service token — fall through to check user token
    }
  }

  // Option B: User request forwarded by api-gateway
  if (userId) {
    return next();
  }

  res.status(401).json({
    success: false,
    error: "Authentication required: provide x-service-token or x-user-id",
    code: "AUTH_REQUIRED",
  });
};

// ── Idempotency Middleware ─────────────────────────────────────────────────────

const idempotencyStore = new Map<string, { status: number; body: unknown; createdAt: number }>();
const IDEMPOTENCY_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

// Cleanup stale entries every 10 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of idempotencyStore) {
    if (now - value.createdAt > IDEMPOTENCY_TTL_MS) {
      idempotencyStore.delete(key);
    }
  }
}, 10 * 60 * 1000);

/**
 * Middleware: Enforces Idempotency-Key header on POST/PATCH requests.
 * Returns cached response if the same key is seen again within 24h.
 *
 * Usage: router.post('/payments', idempotencyMiddleware, controller.createPayment);
 */
export const idempotencyMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!["POST", "PATCH"].includes(req.method)) {
    return next();
  }

  const idempotencyKey = req.headers["idempotency-key"] as string | undefined;
  if (!idempotencyKey) {
    res.status(400).json({
      success: false,
      error: "Idempotency-Key header is required for POST/PATCH requests",
      code: "IDEMPOTENCY_KEY_REQUIRED",
    });
    return;
  }

  const cached = idempotencyStore.get(idempotencyKey);
  if (cached) {
    res.status(cached.status).json(cached.body);
    return;
  }

  // Intercept response to cache it
  const originalJson = res.json.bind(res);
  res.json = (body: unknown) => {
    idempotencyStore.set(idempotencyKey, {
      status: res.statusCode,
      body,
      createdAt: Date.now(),
    });
    return originalJson(body);
  };

  next();
};

// ── Graceful Shutdown Helper ────────────────────────────────────────────────

/**
 * Registers SIGTERM and SIGINT handlers for graceful shutdown.
 * Stops accepting new connections, drains existing ones, then exits.
 *
 * @param server     — HTTP server returned by app.listen()
 * @param cleanup    — Optional async cleanup function (e.g. prisma.$disconnect())
 * @param timeoutMs  — Max time to wait before force-killing (default: 10s)
 */
export const setupGracefulShutdown = (
  server: import("http").Server,
  cleanup?: () => Promise<void>,
  timeoutMs = 10_000
): void => {
  const shutdown = async (signal: string) => {
    console.log(`[graceful-shutdown] Received ${signal}, shutting down...`);

    const forceExit = setTimeout(() => {
      console.error("[graceful-shutdown] Timeout reached, forcing exit");
      process.exit(1);
    }, timeoutMs);
    forceExit.unref();

    server.close(async () => {
      try {
        if (cleanup) await cleanup();
        console.log("[graceful-shutdown] Clean shutdown complete");
        clearTimeout(forceExit);
        process.exit(0);
      } catch (err) {
        console.error("[graceful-shutdown] Cleanup error:", err);
        process.exit(1);
      }
    });
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
};

export type { ServiceTokenPayload, ServiceAuthContext };
