"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initTelemetry = initTelemetry;
function initTelemetry(serviceName) {
    try {
        const { NodeSDK } = require("@opentelemetry/sdk-node");
        const { getNodeAutoInstrumentations } = require("@opentelemetry/auto-instrumentations-node");
        const { OTLPTraceExporter } = require("@opentelemetry/exporter-trace-otlp-proto");
        const { Resource } = require("@opentelemetry/resources");
        const { ATTR_SERVICE_NAME } = require("@opentelemetry/semantic-conventions");
        const otlpEndpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT || "http://jaeger:4318/v1/traces";
        const exporter = new OTLPTraceExporter({
            url: otlpEndpoint,
        });
        const sdk = new NodeSDK({
            resource: new Resource({
                [ATTR_SERVICE_NAME]: serviceName,
            }),
            traceExporter: exporter,
            instrumentations: [
                getNodeAutoInstrumentations({
                    "@opentelemetry/instrumentation-fs": { enabled: false },
                    "@opentelemetry/instrumentation-dns": { enabled: false },
                    "@opentelemetry/instrumentation-net": { enabled: false },
                }),
            ],
        });
        sdk.start();
        console.log(`[Observability] OpenTelemetry SDK initialized for service: ${serviceName} exporting to ${otlpEndpoint}`);
        process.on("SIGTERM", () => {
            sdk.shutdown()
                .then(() => console.log("[Observability] Tracing terminated"))
                .catch((error) => console.log("[Observability] Error terminating tracing", error));
        });
    }
    catch (err) {
        console.warn(`[Observability] OpenTelemetry SDK optional load skipped: ${err?.message || err}`);
    }
}
//# sourceMappingURL=otel.js.map