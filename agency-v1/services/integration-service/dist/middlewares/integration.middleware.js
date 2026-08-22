"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.idempotencyMiddleware = exports.validateRequest = exports.errorHandler = void 0;
const zod_1 = require("zod");
const errorHandler = (err, req, res, _next) => {
    const correlationId = (req.headers["x-correlation-id"] || req.headers["correlation-id"] || "N/A");
    const statusCode = err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    console.error(`[integration-service][Error Trace: ${correlationId}]:`, {
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
                    error: "Invalid integration request payload",
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
var service_auth_1 = require("@agency/service-auth");
Object.defineProperty(exports, "idempotencyMiddleware", { enumerable: true, get: function () { return service_auth_1.idempotencyMiddleware; } });
//# sourceMappingURL=integration.middleware.js.map