/**
 * Enterprise OpenTelemetry & Prometheus APM Metrics Exporter
 * ─────────────────────────────────────────────────────────────────────────────
 * Exposes Prometheus-compatible metric endpoints (/metrics) and provides
 * W3C TraceContext distributed tracing propagators for APM (Datadog/Grafana/Prometheus).
 */
export interface MetricEntry {
    name: string;
    type: "counter" | "gauge" | "histogram";
    help: string;
    value: number;
    labels?: Record<string, string>;
}
export declare class MetricsExporter {
    private metrics;
    constructor();
    private registerDefaultMetrics;
    recordRequest(service: string, statusCode: number, durationMs: number): void;
    /**
     * Generates Prometheus exposition format output (RFC 0001 compliant).
     */
    exportPrometheusFormat(): string;
    /**
     * Generates a W3C TraceContext compliant traceparent header.
     */
    generateTraceParent(): {
        traceparent: string;
        traceId: string;
        spanId: string;
    };
}
export declare const metricsExporter: MetricsExporter;
//# sourceMappingURL=metrics-exporter.d.ts.map