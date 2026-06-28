"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initTelemetry = initTelemetry;
const sdk_node_1 = require("@opentelemetry/sdk-node");
const auto_instrumentations_node_1 = require("@opentelemetry/auto-instrumentations-node");
const exporter_trace_otlp_proto_1 = require("@opentelemetry/exporter-trace-otlp-proto");
const resources_1 = require("@opentelemetry/resources");
const semantic_conventions_1 = require("@opentelemetry/semantic-conventions");
function initTelemetry(serviceName) {
    const otlpEndpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT || "http://jaeger:4318/v1/traces";
    const exporter = new exporter_trace_otlp_proto_1.OTLPTraceExporter({
        url: otlpEndpoint,
    });
    const sdk = new sdk_node_1.NodeSDK({
        resource: new resources_1.Resource({
            [semantic_conventions_1.ATTR_SERVICE_NAME]: serviceName,
        }),
        traceExporter: exporter,
        instrumentations: [
            (0, auto_instrumentations_node_1.getNodeAutoInstrumentations)({
                "@opentelemetry/instrumentation-fs": {
                    enabled: false,
                },
                "@opentelemetry/instrumentation-dns": {
                    enabled: false,
                },
                "@opentelemetry/instrumentation-net": {
                    enabled: false,
                },
            }),
        ],
    });
    sdk.start();
    console.log(`[Observability] OpenTelemetry SDK initialized for service: ${serviceName} exporting to ${otlpEndpoint}`);
    process.on("SIGTERM", () => {
        sdk.shutdown()
            .then(() => console.log("[Observability] Tracing terminated"))
            .catch((error) => console.log("[Observability] Error terminating tracing", error))
            .finally(() => process.exit(0));
    });
}
//# sourceMappingURL=otel.js.map