/**
 * services/notification-service/src/observability/tracer.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * OpenTelemetry Distributed Tracing & Span Helper
 * Propagates W3C TraceContext across EventBus, BullMQ Jobs, and External APIs.
 */

import { trace, context, Span, SpanKind, SpanStatusCode } from "@opentelemetry/api";

const TRACER_NAME = "notification-service";

export function getTracer() {
  return trace.getTracer(TRACER_NAME, "1.2.0");
}

export async function traceSpan<T>(
  name: string,
  fn: (span: Span) => Promise<T>,
  attributes?: Record<string, string | number | boolean>
): Promise<T> {
  const tracer = getTracer();
  return tracer.startActiveSpan(name, { kind: SpanKind.INTERNAL }, async (span) => {
    if (attributes) {
      Object.entries(attributes).forEach(([k, v]) => span.setAttribute(k, v));
    }
    try {
      const result = await fn(span);
      span.setStatus({ code: SpanStatusCode.OK });
      return result;
    } catch (err: any) {
      span.setStatus({ code: SpanStatusCode.ERROR, message: err.message });
      span.recordException(err);
      throw err;
    } finally {
      span.end();
    }
  });
}
