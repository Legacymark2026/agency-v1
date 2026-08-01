"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.idempotencyMiddleware = exports.validateRequest = exports.errorHandler = void 0;
const zod_1 = require("zod");
const errorHandler = (err, req, res, _next) => {
    const correlationId = (req.headers["x-correlation-id"] || req.headers["correlation-id"] || "N/A");
    const statusCode = err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    console.error(`[marketing-service][Error Trace: ${correlationId}]:`, {
        path: req.path,
        method: req.method,
        statusCode,
        error: message,
        stack: err.stack
    });
    res.status(statusCode).json({
        success: false,
        error: message,
        details: err.details || null,
        correlationId,
        timestamp: new Date().toISOString()
    });
};
exports.errorHandler = errorHandler;
const validateRequest = (schema, source = "body") => {
    return (req, res, next) => {
        try {
            const parsed = schema.parse(req[source]);
            req[source] = parsed;
            next();
        }
        catch (err) {
            if (err instanceof zod_1.ZodError) {
                res.status(400).json({
                    success: false,
                    error: "Invalid marketing request payload",
                    details: err.errors.map(e => ({ path: e.path.join("."), message: e.message })),
                    correlationId: req.headers["x-correlation-id"] || null
                });
                return;
            }
            next(err);
        }
    };
};
exports.validateRequest = validateRequest;
// ── Idempotency Middleware (local copy) ────────────────────────────────────────
const _idempotencyStore = new Map();
const idempotencyMiddleware = (req, res, next) => {
    if (!['POST', 'PATCH'].includes(req.method)) {
        return next();
    }
    const key = req.headers['idempotency-key'];
    if (!key) {
        return next();
    }
    const cached = _idempotencyStore.get(`marketing:${key}`);
    if (cached) {
        res.status(cached.status).json(cached.body);
        return;
    }
    const originalJson = res.json.bind(res);
    res.json = (body) => {
        _idempotencyStore.set(`marketing:${key}`, { status: res.statusCode, body, createdAt: Date.now() });
        return originalJson(body);
    };
    next();
};
exports.idempotencyMiddleware = idempotencyMiddleware;
//# sourceMappingURL=marketing.middleware.js.map