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
const useCases = new AuthorizationUseCases(adapter, adapter, adapter, adapter, adapter);

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

// ── Synchronous Encrypted gRPC Server Setup (Port 50052) ─────────────────────
import { GrpcServerHelper, PROTO_PATHS } from "@agency/grpc";
const GRPC_PORT = parseInt(process.env.GRPC_PORT || "50052", 10);
const grpcServer = new GrpcServerHelper();

grpcServer.addService(PROTO_PATHS.authz, "authz", "AuthorizationService", {
  GetRolesByCompany: async (call: any, callback: any) => {
    try {
      const { companyId, requestingTenantId, isSuperAdmin } = call.request;
      const roles = await useCases.getRolesByCompany(companyId, requestingTenantId, isSuperAdmin);
      callback(null, {
        success: true,
        roles: roles.map((r) => ({
          id: r.id,
          name: r.name,
          companyId: r.companyId,
          description: r.description || "",
          isActive: r.isActive,
          permissions: (r.permissions || []).map((p) => ({
            permissionId: p.permissionId,
            permissionName: p.permission?.name || "",
            category: p.permission?.category || "GENERAL",
          })),
        })),
        error: "",
      });
    } catch (err: any) {
      callback(null, { success: false, roles: [], error: err.message });
    }
  },

  CheckPermission: async (call: any, callback: any) => {
    try {
      const {
        userId,
        companyId,
        requiredPermission,
        userRole,
        isSuperAdmin,
        requiredTier,
        skipSubscriptionCheck,
      } = call.request;

      const result = await useCases.checkPermission({
        userId,
        companyId,
        requiredPermission,
        userRole,
        isSuperAdmin,
        requiredTier,
        skipSubscriptionCheck,
      });

      callback(null, {
        granted: result.granted,
        reason: result.reason,
        subscriptionStatus: result.subscriptionCheck?.code || "UNKNOWN",
        subscriptionCode: result.subscriptionCheck?.code || "UNKNOWN",
      });
    } catch (err: any) {
      callback(null, {
        granted: false,
        reason: err.message,
        subscriptionStatus: "ERROR",
        subscriptionCode: "ERROR",
      });
    }
  },

  GetUserRoles: async (call: any, callback: any) => {
    try {
      const { userId, companyId } = call.request;
      const users = await useCases.listUsersWithRoles(companyId, companyId, true);
      const user = users.find((u) => u.id === userId);
      callback(null, {
        userId,
        companyId,
        roleName: user?.companyRole || "member",
        permissions: [],
      });
    } catch (err: any) {
      callback(null, { userId: call.request.userId, companyId: call.request.companyId, roleName: "", permissions: [] });
    }
  },
});

grpcServer.start(GRPC_PORT).catch((err: any) => {
  console.error("[authorization-service] Failed to start gRPC server:", err.message);
});

const server = app.listen(PORT, () => {
  console.log(`🛡️ Authorization Service running on port ${PORT} (HTTP) and port ${GRPC_PORT} (gRPC Encrypted)`);
});

setupGracefulShutdown(server, async () => {
  console.log("[authorization-service] Shutting down cleanly...");
  await grpcServer.forceShutdown();
  await eventBus.disconnect();
  await prisma.$disconnect();
});

export default app;

