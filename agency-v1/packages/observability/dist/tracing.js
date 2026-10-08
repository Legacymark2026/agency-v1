"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTraceId = exports.tracingMiddleware = exports.traceStorage = void 0;
const async_hooks_1 = require("async_hooks");
const crypto_1 = require("crypto");
exports.traceStorage = new async_hooks_1.AsyncLocalStorage();
const tracingMiddleware = (req, res, next) => {
    const traceId = req.headers["x-trace-id"] || (0, crypto_1.randomUUID)();
    res.setHeader("x-trace-id", traceId);
    exports.traceStorage.run({ traceId }, () => {
        next();
    });
};
exports.tracingMiddleware = tracingMiddleware;
const getTraceId = () => {
    return exports.traceStorage.getStore()?.traceId;
};
exports.getTraceId = getTraceId;
//# sourceMappingURL=tracing.js.map