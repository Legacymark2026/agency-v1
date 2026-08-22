"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authGrpcClient = void 0;
require("@agency/observability/register");
const observability_1 = require("@agency/observability");
const express_1 = __importDefault(require("express"));
try {
    require("@agency/observability/register");
}
catch { /* optional */ }
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const events_1 = require("@agency/events");
const grpc_1 = require("@agency/grpc");
const service_auth_1 = require("@agency/service-auth");
const app = (0, express_1.default)();
app.use((0, observability_1.metricsMiddleware)("document-service"));
const PORT = parseInt(process.env.PORT || "4011", 10);
const DOC_GRPC_PORT = parseInt(process.env.GRPC_PORT || "50053", 10);
const AUTH_GRPC_URL = process.env.AUTH_GRPC_URL || "auth-service:50051";
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.get("/health", (_req, res) => {
    res.status(200).json({ status: "ok", service: "document-service", timestamp: new Date().toISOString() });
});
app.get("/metrics", observability_1.metricsEndpoint);
const document_routes_1 = require("./routes/document.routes");
const document_middleware_1 = require("./middlewares/document.middleware");
app.use("/api/v1", document_routes_1.documentRouter);
app.use(document_middleware_1.errorHandler);
// ── Hybrid Event Bus ─────────────────────────────────────────────────────────
const REDIS_URL = process.env.REDIS_URL || "redis://redis:6379";
const eventBus = new events_1.EventBus(REDIS_URL, "document-service");
// ── Synchronous gRPC Server (port 50053) ──────────────────────────────────────
const docGrpcServer = new grpc_1.GrpcServerHelper();
docGrpcServer.addService(grpc_1.PROTO_PATHS.document, "document", "DocumentService", {
    GetDocumentMetadata: async (call, callback) => {
        const { documentId } = call.request;
        callback(null, {
            found: true,
            documentId,
            title: `Document ${documentId}`,
            fileUrl: `https://storage.agency.internal/docs/${documentId}.pdf`,
            mimeType: "application/pdf",
            size: 1024500,
            status: "PUBLISHED",
            error: "",
        });
    },
    CheckHealth: async (_call, callback) => {
        callback(null, {
            status: "healthy",
            service: "document-service",
            timestamp: Date.now(),
        });
    },
});
docGrpcServer.start(DOC_GRPC_PORT).catch(err => {
    console.error("[document-service] Failed to start gRPC server:", err.message);
});
// gRPC Client to Auth Service
exports.authGrpcClient = grpc_1.GrpcClientHelper.getClient("auth-service", grpc_1.PROTO_PATHS.auth, "auth", "AuthService", AUTH_GRPC_URL, { failureThreshold: 3, resetTimeoutMs: 5000, timeoutMs: 3000 });
const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`📄 Document Service running on port ${PORT} (HTTP) and port ${DOC_GRPC_PORT} (gRPC Sync)`);
});
(0, service_auth_1.setupGracefulShutdown)(server);
//# sourceMappingURL=index.js.map