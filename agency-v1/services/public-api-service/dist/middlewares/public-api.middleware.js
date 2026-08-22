"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.idempotencyMiddleware = exports.errorHandler = void 0;
const errorHandler = (err, req, res, _next) => {
    const correlationId = (req.headers["x-correlation-id"] || req.headers["correlation-id"] || "N/A");
    const statusCode = err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    console.error(`[public-api-service][Error Trace: ${correlationId}]:`, {
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
var service_auth_1 = require("@agency/service-auth");
Object.defineProperty(exports, "idempotencyMiddleware", { enumerable: true, get: function () { return service_auth_1.idempotencyMiddleware; } });
//# sourceMappingURL=public-api.middleware.js.map