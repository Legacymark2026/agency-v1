"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
const api_1 = require("@opentelemetry/api");
const winston_1 = __importDefault(require("winston"));
const otelFormat = winston_1.default.format((info) => {
    const activeSpan = api_1.trace.getActiveSpan();
    if (activeSpan) {
        const spanContext = activeSpan.spanContext();
        info.trace_id = spanContext.traceId;
        info.span_id = spanContext.spanId;
        info.trace_flags = spanContext.traceFlags.toString(16);
    }
    return info;
});
exports.logger = winston_1.default.createLogger({
    level: process.env.LOG_LEVEL || "info",
    format: winston_1.default.format.combine(otelFormat(), winston_1.default.format.timestamp(), winston_1.default.format.json()),
    transports: [
        new winston_1.default.transports.Console()
    ]
});
//# sourceMappingURL=logger.js.map