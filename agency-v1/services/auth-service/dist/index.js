"use strict";
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
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
try {
    require("@agency/observability/register");
}
catch { /* optional */ }
const service_auth_1 = require("@agency/service-auth");
const observability_1 = require("@agency/observability");
const grpc_1 = require("@agency/grpc");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const database_1 = require("@agency/database");
// Keystore & Crypto Setup (Fix C-1)
const keys_1 = require("./lib/keys");
const { publicKey } = (0, keys_1.initCryptoKeys)();
// Vault Background Ingestion (Optional)
const vault_1 = require("./services/vault");
vault_1.VaultService.getSecret("secret/data/auth")
    .catch((err) => console.warn("[auth-service] Vault check notice:", err.message));
// EventBus & Redis Singleton (Fix C-5)
const event_bus_singleton_1 = require("./lib/event-bus.singleton");
// Domain Routers
const auth_routes_1 = require("./routes/auth.routes");
const roles_routes_1 = require("./routes/roles.routes");
const mfa_routes_1 = require("./routes/mfa.routes");
const users_routes_1 = require("./routes/users.routes");
const auth_middleware_1 = require("./middlewares/auth.middleware");
const blacklist_1 = require("./utilities/blacklist");
const dpop_1 = require("./utilities/dpop");
const reconciliation_service_1 = require("./services/reconciliation.service");
const app = (0, express_1.default)();
const PORT = parseInt(process.env.PORT || "4001", 10);
const GRPC_PORT = parseInt(process.env.GRPC_PORT || "50051", 10);
// ── Observability & Middlewares ───────────────────────────────────────────────
app.use((0, observability_1.metricsMiddleware)("auth-service"));
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: process.env.ALLOWED_ORIGINS?.split(",") || ["http://localhost:3000"],
    credentials: true,
}));
app.use(express_1.default.json({ limit: "2mb" }));
// ── JWKS Endpoint (JSON Web Key Set - RFC 7517) ──────────────────────────────
app.get("/.well-known/jwks.json", (_req, res) => {
    try {
        const { publicKey: currentPubKey } = (0, keys_1.getCryptoKeys)();
        if (!currentPubKey)
            return res.status(500).json({ error: "Public key unavailable" });
        const cryptoMod = require("crypto");
        const pubKeyObj = cryptoMod.createPublicKey(currentPubKey);
        const jwk = pubKeyObj.export({ format: "jwk" });
        res.json({
            keys: [
                {
                    ...jwk,
                    use: "sig",
                    alg: "RS256",
                    kid: "auth-service-rs256-key-1",
                },
            ],
        });
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// ── Health & Readiness Checks ────────────────────────────────────────────────
app.get("/health", (_req, res) => {
    res.json({ status: "healthy", service: "auth-service", timestamp: new Date().toISOString() });
});
app.get("/metrics", observability_1.metricsEndpoint);
app.get("/ready", async (_req, res) => {
    try {
        await database_1.prisma.$queryRaw `SELECT 1`;
        res.json({ status: "ready", db: "connected" });
    }
    catch (err) {
        res.status(503).json({ status: "not_ready", db: "disconnected", error: String(err) });
    }
});
// ── Domain Routers ────────────────────────────────────────────────────────────
// Mount to both /api/auth and /api/v1/auth for seamless backward compatibility
app.use("/api/auth", auth_routes_1.authRouter);
app.use("/api/auth", roles_routes_1.rolesRouter);
app.use("/api/auth", mfa_routes_1.mfaRouter);
app.use("/api/auth", users_routes_1.usersRouter);
app.use("/api/v1/auth", auth_routes_1.authRouter);
app.use("/api/v1/auth", roles_routes_1.rolesRouter);
app.use("/api/v1/auth", mfa_routes_1.mfaRouter);
app.use("/api/v1/auth", users_routes_1.usersRouter);
// ── Centralized Error Handler ────────────────────────────────────────────────
app.use(auth_middleware_1.errorHandler);
// ── Synchronous gRPC Server Setup (Port 50051) ────────────────────────────────
const grpcServer = new grpc_1.GrpcServerHelper();
grpcServer.addService(grpc_1.PROTO_PATHS.auth, "auth", "AuthService", {
    ValidateToken: async (call, callback) => {
        try {
            const { token, dpopProof, httpMethod, httpUrl } = call.request;
            if (!token) {
                return callback(null, { valid: false, error: "Token is required" });
            }
            const isRevoked = await (0, blacklist_1.isTokenRevoked)(token);
            if (isRevoked) {
                return callback(null, { valid: false, error: "Token has been revoked" });
            }
            const { publicKey: currentPubKey } = (0, keys_1.getCryptoKeys)();
            const verifyKey = currentPubKey || process.env.JWT_SECRET;
            if (!verifyKey)
                return callback(null, { valid: false, error: "Auth misconfigured" });
            const verifyOptions = currentPubKey ? { algorithms: ["RS256"] } : {};
            const decoded = jsonwebtoken_1.default.verify(token, verifyKey, verifyOptions);
            if (decoded.cnf?.jkt) {
                if (!dpopProof) {
                    return callback(null, { valid: false, error: "DPoP proof required for this token" });
                }
                const verification = await (0, dpop_1.verifyDPoPProof)(dpopProof, httpMethod || "GET", httpUrl || "");
                if (!verification.success || verification.thumbprint !== decoded.cnf.jkt) {
                    return callback(null, { valid: false, error: verification.error || "DPoP proof signature mismatch" });
                }
            }
            const { userRepository } = await Promise.resolve().then(() => __importStar(require("./repositories/user.repository")));
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
        }
        catch (err) {
            callback(null, { valid: false, error: err.message || "Invalid token" });
        }
    },
    GetUserPermissions: async (call, callback) => {
        try {
            const { userId } = call.request;
            const user = await database_1.prisma.user.findUnique({
                where: { id: userId },
                select: { id: true, role: true },
            });
            if (!user) {
                return callback(null, { userId, permissions: [], role: "" });
            }
            const roleConfig = await database_1.prisma.roleConfig.findUnique({
                where: { roleName: user.role || "user" },
            });
            const permissions = roleConfig?.allowedRoutes || ["/api/*"];
            callback(null, {
                userId: user.id,
                permissions,
                role: user.role || "user",
            });
        }
        catch (err) {
            callback(null, { userId: call.request.userId, permissions: [], role: "" });
        }
    },
});
grpcServer.start(GRPC_PORT).catch((err) => {
    console.error("[auth-service] Failed to start gRPC server:", err.message);
});
// ── Start HTTP Server ────────────────────────────────────────────────────────
const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`🔐 Auth Service running on port ${PORT} (HTTP) and port ${GRPC_PORT} (gRPC Sync)`);
    // Scheduled User Reconciliation
    setTimeout(() => {
        reconciliation_service_1.ReconciliationService.runUserReconciliation()
            .then((stats) => console.log("[Reconciliation] Startup run complete:", stats))
            .catch((err) => console.error("[Reconciliation] Startup run failed:", err));
    }, 10000);
    setInterval(() => {
        reconciliation_service_1.ReconciliationService.runUserReconciliation()
            .then((stats) => console.log("[Reconciliation] Scheduled run complete:", stats))
            .catch((err) => console.error("[Reconciliation] Scheduled run failed:", err));
    }, 24 * 60 * 60 * 1000);
});
(0, service_auth_1.setupGracefulShutdown)(server, async () => {
    console.log("[auth-service] Shutting down gracefully...");
    await grpcServer.forceShutdown();
    await (0, event_bus_singleton_1.disconnectAuthEventBusAndRedis)();
    await database_1.prisma.$disconnect();
});
exports.default = app;
//# sourceMappingURL=index.js.map