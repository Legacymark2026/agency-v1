/**
 * services/notification-service/src/observability/tracer.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * OpenTelemetry Distributed Tracing & Span Helper
 * Propagates W3C TraceContext across EventBus, BullMQ Jobs, and External APIs.
 */
import { Span } from "@opentelemetry/api";
export declare function getTracer(): import("@opentelemetry/api").Tracer;
export declare function traceSpan<T>(name: string, fn: (span: Span) => Promise<T>, attributes?: Record<string, string | number | boolean>): Promise<T>;
//# sourceMappingURL=tracer.d.ts.map