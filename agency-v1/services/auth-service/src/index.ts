/**
 * Auth Service — Identity & Access Management Microservice
 * ─────────────────────────────────────────────────────────────────────────────
 * Handles: Authentication, Authorization, RBAC, MFA, Sessions, API Keys, JWKS
 * Port: 4001 (HTTP) | Port: 50051 (gRPC Sync)
 *
 * Fixes applied in this refactor:
 *   C-1: Keystore initialized deterministically via lib/keys.ts (no race conditions)
 *   C-2: Unification of authentication handlers into dedicated domain routers
 *   C-3: Strict multi-tenant boundaries on roles, permissions & users
 *   C-4: Zod whitelisting preventing mass-assignment and privilege escalation
 *   C-5: Shared EventBus and Redis singleton client
 *   A-1 & A-2: 980-line God Object refactored into modular domain routers
 */

try { require("@agency/observability/register"); } catch { /* optional */ }
import { setupGracefulShutdown } from "@agency/service-auth";
import { metricsMiddleware, metricsEndpoint } from "@agency/observability";
import { GrpcServerHelper, PROTO_PATHS } from "@agency/grpc";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import jwt from "jsonwebtoken";
import { prisma } from "@agency/database";

// Keystore & Crypto Setup (Fix C-1)
import { initCryptoKeys, getCryptoKeys } from "./lib/keys";
const { publicKey } = initCryptoKeys();

// Vault Background Ingestion (Optional)
import { VaultService } from "./services/vault";
VaultService.getSecret<{ privateKey: string; publicKey: string; jwtSecret: string }>("secret/data/auth")
  .catch((err) => console.warn("[auth-service] Vault check notice:", err.message));

// EventBus & Redis Singleton (Fix C-5)
import { eventBus, disconnectAuthEventBusAndRedis } from "./lib/event-bus.singleton";

// Domain Routers
import { authRouter } from "./routes/auth.routes";
import { rolesRouter } from "./routes/roles.routes";
import { mfaRouter } from "./routes/mfa.routes";
import { usersRouter } from "./routes/users.routes";
import { errorHandler } from "./middlewares/auth.middleware";
import { isTokenRevoked } from "./utilities/blacklist";
import { verifyDPoPProof } from "./utilities/dpop";
import { ReconciliationService } from "./services/reconciliation.service";

const app = express();
const PORT = parseInt(process.env.PORT || "4001", 10);
const GRPC_PORT = parseInt(process.env.GRPC_PORT || "50051", 10);

// ── Observability & Middlewares ───────────────────────────────────────────────
app.use(metricsMiddleware("auth-service"));
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(",") || ["http://localhost:3000"],
  credentials: true,
}));
app.use(express.json({ limit: "2mb" }));

// ── JWKS Endpoint (RFC 7517) ──────────────────────────────────────────────────
app.use("/.well-known", authRouter);

// ── Health & Readiness Checks ────────────────────────────────────────────────
app.get("/health", (_req, res) => {
  res.json({ status: "healthy", service: "auth-service", timestamp: new Date().toISOString() });
});

app.get("/metrics", metricsEndpoint);

app.get("/ready", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: "ready", db: "connected" });
  } catch (err) {
    res.status(503).json({ status: "not_ready", db: "disconnected", error: String(err) });
  }
});

// ── Domain Routers ────────────────────────────────────────────────────────────
// Mount to both /api/auth and /api/v1/auth for seamless backward compatibility
app.use("/api/auth", authRouter);
app.use("/api/auth", rolesRouter);
app.use("/api/auth", mfaRouter);
app.use("/api/auth", usersRouter);

app.use("/api/v1/auth", authRouter);
app.use("/api/v1/auth", rolesRouter);
app.use("/api/v1/auth", mfaRouter);
app.use("/api/v1/auth", usersRouter);

// ── Centralized Error Handler ────────────────────────────────────────────────
app.use(errorHandler);

// ── Synchronous gRPC Server Setup (Port 50051) ────────────────────────────────
const grpcServer = new GrpcServerHelper();

grpcServer.addService(PROTO_PATHS.auth, "auth", "AuthService", {
  ValidateToken: async (call: any, callback: any) => {
    try {
      const { token, dpopProof, httpMethod, httpUrl } = call.request;
      if (!token) {
        return callback(null, { valid: false, error: "Token is required" });
      }

      const isRevoked = await isTokenRevoked(token);
      if (isRevoked) {
        return callback(null, { valid: false, error: "Token has been revoked" });
      }

      const { publicKey: currentPubKey } = getCryptoKeys();
      const verifyKey = currentPubKey || process.env.JWT_SECRET;
      if (!verifyKey) return callback(null, { valid: false, error: "Auth misconfigured" });

      const verifyOptions: any = currentPubKey ? { algorithms: ["RS256"] } : {};
      const decoded = jwt.verify(token, verifyKey, verifyOptions) as any;

      if (decoded.cnf?.jkt) {
        if (!dpopProof) {
          return callback(null, { valid: false, error: "DPoP proof required for this token" });
        }
        const verification = await verifyDPoPProof(dpopProof, httpMethod || "GET", httpUrl || "");
        if (!verification.success || verification.thumbprint !== decoded.cnf.jkt) {
          return callback(null, { valid: false, error: verification.error || "DPoP proof signature mismatch" });
        }
      }

      const { userRepository } = await import("./repositories/user.repository");
      const user = await userRepository.findById(decoded.sub);

      if (!user) {
        return callback(null, { valid: false, error: "User not found" });
      }

      callback(null, {
        valid: true,
        userId: user.id,
        email: user.email,
        role: user.role || "user",
        companyId: decoded.companyId || "",
        error: "",
      });
    } catch (err: any) {
      callback(null, { valid: false, error: err.message || "Invalid token" });
    }
  },

  GetUserPermissions: async (call: any, callback: any) => {
    try {
      const { userId } = call.request;
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, role: true },
      });

      if (!user) {
        return callback(null, { userId, permissions: [], role: "" });
      }

      const roleConfig = await prisma.roleConfig.findUnique({
        where: { roleName: user.role || "user" },
      });

      const permissions = roleConfig?.allowedRoutes || ["/api/*"];

      callback(null, {
        userId: user.id,
        permissions,
        role: user.role || "user",
      });
    } catch (err: any) {
      callback(null, { userId: call.request.userId, permissions: [], role: "" });
    }
  },
});

grpcServer.start(GRPC_PORT).catch((err: any) => {
  console.error("[auth-service] Failed to start gRPC server:", err.message);
});

// ── Start HTTP Server ────────────────────────────────────────────────────────
const server = app.listen(PORT, "0.0.0.0", () => {
  console.log(`🔐 Auth Service running on port ${PORT} (HTTP) and port ${GRPC_PORT} (gRPC Sync)`);

  // Scheduled User Reconciliation
  setTimeout(() => {
    ReconciliationService.runUserReconciliation()
      .then((stats) => console.log("[Reconciliation] Startup run complete:", stats))
      .catch((err) => console.error("[Reconciliation] Startup run failed:", err));
  }, 10000);

  setInterval(() => {
    ReconciliationService.runUserReconciliation()
      .then((stats) => console.log("[Reconciliation] Scheduled run complete:", stats))
      .catch((err) => console.error("[Reconciliation] Scheduled run failed:", err));
  }, 24 * 60 * 60 * 1000);
});

setupGracefulShutdown(server, async () => {
  console.log("[auth-service] Shutting down gracefully...");
  await grpcServer.forceShutdown();
  await disconnectAuthEventBusAndRedis();
  await prisma.$disconnect();
});

export default app as any;
