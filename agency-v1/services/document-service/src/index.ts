import "@agency/observability/register";
import { metricsMiddleware, metricsEndpoint } from "@agency/observability";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import { EventBus } from "@agency/events";
import { GrpcServerHelper, GrpcClientHelper, PROTO_PATHS } from "@agency/grpc";

const app = express();
app.use(metricsMiddleware("document-service"));

const PORT = parseInt(process.env.PORT || "4011", 10);
const DOC_GRPC_PORT = parseInt(process.env.GRPC_PORT || "50053", 10);
const AUTH_GRPC_URL = process.env.AUTH_GRPC_URL || "auth-service:50051";

app.use(helmet());
app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok", service: "document-service", timestamp: new Date().toISOString() });
});
app.get("/metrics", metricsEndpoint);

import { documentRouter } from "./routes/document.routes";
import { errorHandler } from "./middlewares/document.middleware";

app.use("/api", documentRouter);
app.use(errorHandler);

// ── Hybrid Event Bus ─────────────────────────────────────────────────────────
const REDIS_URL = process.env.REDIS_URL || "redis://redis:6379";
const eventBus = new EventBus(REDIS_URL, "document-service");

// ── Synchronous gRPC Server (port 50053) ──────────────────────────────────────
const docGrpcServer = new GrpcServerHelper();
docGrpcServer.addService(
  PROTO_PATHS.document,
  "document",
  "DocumentService",
  {
    GetDocumentMetadata: async (call: any, callback: any) => {
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
    CheckHealth: async (_call: any, callback: any) => {
      callback(null, {
        status: "healthy",
        service: "document-service",
        timestamp: Date.now(),
      });
    },
  }
);

docGrpcServer.start(DOC_GRPC_PORT).catch(err => {
  console.error("[document-service] Failed to start gRPC server:", err.message);
});

// gRPC Client to Auth Service
export const authGrpcClient = GrpcClientHelper.getClient(
  "auth-service",
  PROTO_PATHS.auth,
  "auth",
  "AuthService",
  AUTH_GRPC_URL,
  { failureThreshold: 3, resetTimeoutMs: 5000, timeoutMs: 3000 }
);

app.listen(PORT, "0.0.0.0", () => {
  console.log(`📄 Document Service running on port ${PORT} (HTTP) and port ${DOC_GRPC_PORT} (gRPC Sync)`);
});
