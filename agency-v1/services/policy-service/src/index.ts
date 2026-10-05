/**
 * Centralized Policy Engine Microservice (PDP - Policy Decision Point)
 * Port: 4050
 *
 * Responsibilities:
 *   - Centralized ABAC / PBAC authorization evaluation (<5ms SLA)
 *   - Multi-tenant boundary isolation and zero-trust policy enforcement
 *   - Dual-control governance for high-value transactions
 *   - Real-time policy simulation and dry-run auditing
 *   - Audit telemetry emission for compliance and security forensics
 */

import express from "express";
import cors from "cors";
import helmet from "helmet";
import { metricsMiddleware, metricsEndpoint } from "@agency/observability";
import { setupGracefulShutdown, tenantContextMiddleware, globalErrorHandler } from "@agency/service-auth";
import { EventBus } from "@agency/events";
import { InMemoryPolicyAdapter } from "./adapters/policy-db.adapter";
import { PolicyUseCases } from "./core/usecases/policy.usecases";
import { createPolicyRouter } from "./routes/policy.routes";

const app = express();
const PORT = process.env.PORT || 4050;
const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

const eventBus = new EventBus(REDIS_URL, "policy-service");
const policyAdapter = new InMemoryPolicyAdapter(eventBus);
const policyUseCases = new PolicyUseCases(policyAdapter, policyAdapter);

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(tenantContextMiddleware);
app.use(metricsMiddleware("policy-service"));

app.get("/metrics", metricsEndpoint);

app.get("/health", (_req, res) => {
  res.json({
    status: "healthy",
    service: "policy-service",
    version: "1.0.0",
    engine: "XACML-ABAC-ZeroTrust",
    activePoliciesCount: 5,
    timestamp: new Date().toISOString(),
  });
});

// Main API Router
app.use("/api/policies", createPolicyRouter(policyUseCases));

app.use(globalErrorHandler);

// ── Synchronous Encrypted gRPC Server Setup (Port 50053) ─────────────────────
import { GrpcServerHelper, PROTO_PATHS } from "@agency/grpc";
const GRPC_PORT = parseInt(process.env.GRPC_PORT || "50053", 10);
const grpcServer = new GrpcServerHelper();

grpcServer.addService(PROTO_PATHS.policy, "policy", "PolicyEngineService", {
  EvaluatePolicy: async (call: any, callback: any) => {
    try {
      const { subject, action, resource, context } = call.request;
      const evaluationPayload: any = {
        subject: {
          id: subject?.id || "anonymous",
          role: subject?.role || "GUEST",
          roles: subject?.roles || [],
          tenantId: subject?.tenantId || subject?.companyId,
          companyId: subject?.companyId || subject?.tenantId,
          department: subject?.department,
          clearanceLevel: subject?.clearanceLevel,
          isMfaVerified: !!subject?.isMfaVerified,
        },
        action: action || "READ",
        resource: {
          type: resource?.type || "SYSTEM",
          id: resource?.id,
          tenantId: resource?.tenantId || resource?.companyId,
          companyId: resource?.companyId || resource?.tenantId,
          amount: resource?.amount || 0,
          classification: resource?.classification || "INTERNAL",
          status: resource?.status,
          ownerId: resource?.ownerId,
        },
        context: {
          currentTime: context?.currentTime ? new Date(context.currentTime) : new Date(),
          ipAddress: context?.ipAddress,
          isOffHours: !!context?.isOffHours,
          riskScore: context?.riskScore || 0,
          originatingService: context?.originatingService || "grpc-caller",
        },
      };

      const result = await policyUseCases.evaluate(evaluationPayload);

      callback(null, {
        decision: result.decision,
        matchingPolicies: result.matchingPolicies || [],
        reasons: result.reasons || [],
        obligations: result.obligations || [],
        evaluationDurationMs: result.evaluationDurationMs || 0,
        timestamp: result.timestamp || new Date().toISOString(),
      });
    } catch (err: any) {
      callback(null, {
        decision: "DENY",
        matchingPolicies: [],
        reasons: [err.message || "Internal gRPC evaluation error"],
        obligations: [],
        evaluationDurationMs: 0,
        timestamp: new Date().toISOString(),
      });
    }
  },

  HealthCheck: async (_call: any, callback: any) => {
    callback(null, {
      status: "healthy",
      service: "policy-service",
      version: "1.0.0",
      activePoliciesCount: 5,
    });
  },
});

grpcServer.start(GRPC_PORT).catch((err: any) => {
  console.error("[policy-service] Failed to start gRPC server:", err.message);
});

const server = app.listen(PORT, () => {
  console.log(`[policy-service] Centralized Policy Engine running on port ${PORT} (HTTP) and port ${GRPC_PORT} (gRPC Encrypted)`);
});

setupGracefulShutdown(server, async () => {
  console.log("[policy-service] Shutting down cleanly...");
  await grpcServer.forceShutdown();
  await eventBus.disconnect();
});

export default app;

