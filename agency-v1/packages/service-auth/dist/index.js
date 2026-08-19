"use strict";
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupGracefulShutdown = exports.idempotencyMiddleware = exports.requireUserOrServiceAuth = exports.requireServiceAuth = exports.verifyServiceToken = exports.signServiceToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
// ── Configuration ─────────────────────────────────────────────────────────────
const SERVICE_JWT_SECRET = process.env.SERVICE_JWT_SECRET ||
    "legacymark-service-internal-secret-CHANGE-IN-PROD-min-32-chars";
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
const signServiceToken = (serviceId, serviceName, permissions = ["*"]) => {
    return jsonwebtoken_1.default.sign({ serviceId, serviceName, permissions }, SERVICE_JWT_SECRET, { expiresIn: SERVICE_TOKEN_EXPIRY, issuer: "legacymark-services" });
};
exports.signServiceToken = signServiceToken;
/**
 * Verifies and decodes a service JWT.
 * Throws if the token is invalid or expired.
 */
const verifyServiceToken = (token) => {
    return jsonwebtoken_1.default.verify(token, SERVICE_JWT_SECRET, {
        issuer: "legacymark-services",
    });
};
exports.verifyServiceToken = verifyServiceToken;
// ── Express Middlewares ────────────────────────────────────────────────────────
/**
 * Middleware: Requires a valid x-service-token header.
 * Use on routes that are ONLY called by other internal services.
 */
const requireServiceAuth = (req, res, next) => {
    const token = req.headers["x-service-token"];
    if (!token) {
        res.status(401).json({
            success: false,
            error: "Missing x-service-token header",
            code: "SERVICE_AUTH_REQUIRED",
        });
        return;
    }
    try {
        const payload = (0, exports.verifyServiceToken)(token);
        req.serviceContext = {
            serviceId: payload.serviceId,
            serviceName: payload.serviceName,
            permissions: payload.permissions,
        };
        next();
    }
    catch {
        res.status(401).json({
            success: false,
            error: "Invalid or expired service token",
            code: "SERVICE_AUTH_INVALID",
        });
    }
};
exports.requireServiceAuth = requireServiceAuth;
/**
 * Middleware: Accepts EITHER a valid x-service-token OR a forwarded user context
 * (x-user-id set by the api-gateway after JWT validation).
 * Use on routes accessible both by end-users (via gateway) and internal services.
 */
const requireUserOrServiceAuth = (req, res, next) => {
    const serviceToken = req.headers["x-service-token"];
    const userId = req.headers["x-user-id"];
    // Option A: Service-to-service call
    if (serviceToken) {
        try {
            const payload = (0, exports.verifyServiceToken)(serviceToken);
            req.serviceContext = {
                serviceId: payload.serviceId,
                serviceName: payload.serviceName,
                permissions: payload.permissions,
            };
            return next();
        }
        catch {
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
exports.requireUserOrServiceAuth = requireUserOrServiceAuth;
// ── Idempotency Middleware ─────────────────────────────────────────────────────
const idempotencyStore = new Map();
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
const idempotencyMiddleware = (req, res, next) => {
    if (!["POST", "PATCH"].includes(req.method)) {
        return next();
    }
    const idempotencyKey = req.headers["idempotency-key"];
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
    res.json = (body) => {
        idempotencyStore.set(idempotencyKey, {
            status: res.statusCode,
            body,
            createdAt: Date.now(),
        });
        return originalJson(body);
    };
    next();
};
exports.idempotencyMiddleware = idempotencyMiddleware;
// ── Graceful Shutdown Helper ────────────────────────────────────────────────
/**
 * Registers SIGTERM and SIGINT handlers for graceful shutdown.
 * Stops accepting new connections, drains existing ones, then exits.
 *
 * @param server     — HTTP server returned by app.listen()
 * @param cleanup    — Optional async cleanup function (e.g. prisma.$disconnect())
 * @param timeoutMs  — Max time to wait before force-killing (default: 10s)
 */
const setupGracefulShutdown = (server, cleanup, timeoutMs = 10000) => {
    const shutdown = async (signal) => {
        console.log(`[graceful-shutdown] Received ${signal}, shutting down...`);
        const forceExit = setTimeout(() => {
            console.error("[graceful-shutdown] Timeout reached, forcing exit");
            process.exit(1);
        }, timeoutMs);
        forceExit.unref();
        server.close(async () => {
            try {
                if (cleanup)
                    await cleanup();
                console.log("[graceful-shutdown] Clean shutdown complete");
                clearTimeout(forceExit);
                process.exit(0);
            }
            catch (err) {
                console.error("[graceful-shutdown] Cleanup error:", err);
                process.exit(1);
            }
        });
    };
    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("SIGINT", () => shutdown("SIGINT"));
};
exports.setupGracefulShutdown = setupGracefulShutdown;
//# sourceMappingURL=index.js.map