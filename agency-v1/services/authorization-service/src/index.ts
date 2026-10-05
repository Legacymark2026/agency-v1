/**
 * Centralized Authorization Microservice (AuthZ Engine — RBAC, Permissions, Tenant Scopes)
 * Port: 4055
 *
 * Responsibilities:
 *   - Role lifecycle management per company / tenant
 *   - Fine-grained permission matrices and assignments
 *   - RoleConfig allowed-route catalog
 *   - Strict tenant boundary evaluation
 *   - Event publishing for audit and governance
 */

import express from "express";
import cors from "cors";
import helmet from "helmet";
import { metricsMiddleware, metricsEndpoint } from "@agency/observability";
import { setupGracefulShutdown, tenantContextMiddleware, globalErrorHandler } from "@agency/service-auth";
import { EventBus } from "@agency/events";
import { prisma } from "@agency/database";
import { PrismaAuthorizationAdapter } from "./adapters/authorization-prisma.adapter";
import { AuthorizationUseCases } from "./core/usecases/authorization.usecases";
import { createAuthorizationRouter } from "./routes/authorization.routes";

const app = express();
const PORT = process.env.PORT || 4055;
const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

const eventBus = new EventBus(REDIS_URL, "authorization-service");
const adapter = new PrismaAuthorizationAdapter(eventBus);
const useCases = new AuthorizationUseCases(adapter, adapter, adapter, adapter);

app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(",") || ["http://localhost:3000"],
  credentials: true,
}));
app.use(express.json({ limit: "2mb" }));
app.use(tenantContextMiddleware);
app.use(metricsMiddleware("authorization-service"));

app.get("/metrics", metricsEndpoint);

app.get("/health", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({
      status: "healthy",
      service: "authorization-service",
      version: "1.0.0",
      engine: "Hexagonal-RBAC-MultiTenant",
      db: "connected",
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    res.status(503).json({
      status: "unhealthy",
      service: "authorization-service",
      db: "disconnected",
      error: err.message,
    });
  }
});

// Mount Routes (supporting both /api/authz and /api/auth/roles for backwards compatibility)
app.use("/api/authz", createAuthorizationRouter(useCases));
app.use("/api/auth", createAuthorizationRouter(useCases));
app.use("/api/v1/authz", createAuthorizationRouter(useCases));

app.use(globalErrorHandler);

const server = app.listen(PORT, () => {
  console.log(`🛡️ Authorization Service (AuthZ Engine) running on port ${PORT}`);
});

setupGracefulShutdown(server, async () => {
  console.log("[authorization-service] Shutting down cleanly...");
  await eventBus.disconnect();
  await prisma.$disconnect();
});

export default app;
