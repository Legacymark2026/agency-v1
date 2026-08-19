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
import { Request, Response, NextFunction } from "express";
import { ServiceTokenPayload, ServiceAuthContext } from "./types";
/**
 * Signs a short-lived JWT for inter-service communication.
 * Each service should sign its own token before calling another service.
 *
 * @param serviceId    — Unique identifier for the calling service (e.g. 'crm-service')
 * @param serviceName  — Human-readable name (e.g. 'CRM Service')
 * @param permissions  — List of permissions (default: ['*'] = all)
 */
export declare const signServiceToken: (serviceId: string, serviceName: string, permissions?: string[]) => string;
/**
 * Verifies and decodes a service JWT.
 * Throws if the token is invalid or expired.
 */
export declare const verifyServiceToken: (token: string) => ServiceTokenPayload;
/**
 * Middleware: Requires a valid x-service-token header.
 * Use on routes that are ONLY called by other internal services.
 */
export declare const requireServiceAuth: (req: Request, res: Response, next: NextFunction) => void;
/**
 * Middleware: Accepts EITHER a valid x-service-token OR a forwarded user context
 * (x-user-id set by the api-gateway after JWT validation).
 * Use on routes accessible both by end-users (via gateway) and internal services.
 */
export declare const requireUserOrServiceAuth: (req: Request, res: Response, next: NextFunction) => void;
/**
 * Middleware: Enforces Idempotency-Key header on POST/PATCH requests.
 * Returns cached response if the same key is seen again within 24h.
 *
 * Usage: router.post('/payments', idempotencyMiddleware, controller.createPayment);
 */
export declare const idempotencyMiddleware: (req: Request, res: Response, next: NextFunction) => void;
/**
 * Registers SIGTERM and SIGINT handlers for graceful shutdown.
 * Stops accepting new connections, drains existing ones, then exits.
 *
 * @param server     — HTTP server returned by app.listen()
 * @param cleanup    — Optional async cleanup function (e.g. prisma.$disconnect())
 * @param timeoutMs  — Max time to wait before force-killing (default: 10s)
 */
export declare const setupGracefulShutdown: (server: import("http").Server, cleanup?: () => Promise<void>, timeoutMs?: number) => void;
export type { ServiceTokenPayload, ServiceAuthContext };
//# sourceMappingURL=index.d.ts.map