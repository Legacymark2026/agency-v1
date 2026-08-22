"use strict";
/**
 * services/notification-service/src/observability/tracer.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * OpenTelemetry Distributed Tracing & Span Helper
 * Propagates W3C TraceContext across EventBus, BullMQ Jobs, and External APIs.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTracer = getTracer;
exports.traceSpan = traceSpan;
const api_1 = require("@opentelemetry/api");
const TRACER_NAME = "notification-service";
function getTracer() {
    return api_1.trace.getTracer(TRACER_NAME, "1.2.0");
}
async function traceSpan(name, fn, attributes) {
    const tracer = getTracer();
    return tracer.startActiveSpan(name, { kind: api_1.SpanKind.INTERNAL }, async (span) => {
        if (attributes) {
            Object.entries(attributes).forEach(([k, v]) => span.setAttribute(k, v));
        }
        try {
            const result = await fn(span);
            span.setStatus({ code: api_1.SpanStatusCode.OK });
            return result;
        }
        catch (err) {
            span.setStatus({ code: api_1.SpanStatusCode.ERROR, message: err.message });
            span.recordException(err);
            throw err;
        }
        finally {
            span.end();
        }
    });
}
//# sourceMappingURL=tracer.js.map