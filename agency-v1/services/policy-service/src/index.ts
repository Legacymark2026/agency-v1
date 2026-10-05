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

const server = app.listen(PORT, () => {
  console.log(`[policy-service] Centralized Policy Engine running on port ${PORT}`);
});

setupGracefulShutdown(server, async () => {
  console.log("[policy-service] Shutting down cleanly...");
  await eventBus.disconnect();
});

export default app;
