/**
 * API Gateway — Central Traffic Router & Security Firewall
 * ─────────────────────────────────────────────────────────────────────────────
 * Port: 8080 (public-facing entrypoint)
 *
 * Fixes applied in this refactor:
 *   C-1: Synchronous token validation via authenticateGatewayRequest prevents
 *        race conditions in proxyReq identity header injection
 *   C-2: Elimination of cross-user multi-tenant data leaks in edge caching
 *   C-3: Singleton Redis client in lib/redis.singleton.ts with graceful shutdown
 *   C-4: Ordered proxy routing table preventing route shadowing on /api/v1
 *   C-5: Automatic removal of spoofed identity headers from untrusted clients
 *   A-1 & A-2: 813-line God Object refactored into modular components
 */

try { require("@agency/observability/register"); } catch { /* optional */ }
import { metricsMiddleware, metricsEndpoint } from "@agency/observability";
import { setupGracefulShutdown } from "@agency/service-auth";
import express from "express";
import rateLimit from "express-rate-limit";
import cors from "cors";
import helmet from "helmet";
import crypto from "crypto";

// Singletons & Modules
import { redisClient, disconnectGatewayRedis } from "./lib/redis.singleton";
import { authenticateGatewayRequest, authGrpcClient } from "./middlewares/auth-gateway.middleware";
import { apiUsageMeteringMiddleware } from "./middlewares/metering.middleware";
import { proxyRouter } from "./routes/proxy.routes";
import { resolveServiceUrl } from "./lib/service-registry";

const app = express();
const PORT = parseInt(process.env.PORT || "8080", 10);

// ── Observability & Security Middlewares ───────────────────────────────────────
app.use(metricsMiddleware("api-gateway"));
app.use(rateLimit({
  windowMs: 60 * 1000,
  limit: 500,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests", retryAfterSeconds: 60 },
}));
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(",") || ["http://localhost:3000"],
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Content-Type", "Authorization", "x-api-key", "x-device-id",
    "x-correlation-id", "x-company-id", "x-service-token", "dpop"
  ],
  exposedHeaders: ["x-correlation-id", "X-RateLimit-Limit", "X-RateLimit-Remaining"],
  credentials: true,
}));

// ── Distributed Tracing & Correlation ID ──────────────────────────────────────
app.use((req, res, next) => {
  const correlationId = (req.headers["x-correlation-id"] || req.headers["correlation-id"] || crypto.randomUUID()) as string;
  req.headers["x-correlation-id"] = correlationId;
  res.setHeader("x-correlation-id", correlationId);
  next();
});

// ── Health & Metrics ──────────────────────────────────────────────────────────
app.get("/health", (_req, res) => {
  res.json({ status: "healthy", service: "api-gateway", timestamp: new Date().toISOString() });
});

app.get("/metrics", metricsEndpoint);

// ── Token Verification Inter-Service RPC ──────────────────────────────────────
app.post("/api/gateway/verify-token", express.json(), async (req, res) => {
  const { token } = req.body;
  if (!token) return res.status(400).json({ valid: false, error: "Token required" });

  try {
    const result: any = await authGrpcClient.call("ValidateToken", { token }, async () => {
      const authUrl = await resolveServiceUrl("auth");
      const resp = await fetch(`${authUrl}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
        signal: AbortSignal.timeout(3000),
      });
      const data: any = await resp.json();
      return {
        valid: resp.ok,
        userId: data.user?.id || "",
        email: data.user?.email || "",
        role: data.user?.role || "",
        companyId: "",
        error: resp.ok ? "" : (data.error || "HTTP verification failed"),
      };
    });
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ valid: false, error: err.message });
  }
});

// ── Metering Middleware ───────────────────────────────────────────────────────
app.use(apiUsageMeteringMiddleware);

// ── Synchronous Pre-Authentication & Identity Injection (Fix C-1 & C-5) ────────
app.use(authenticateGatewayRequest);

// ── Microservice Proxy Router ─────────────────────────────────────────────────
app.use(proxyRouter);

// ── 404 Fallback ─────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: "Route not found", hint: "Check API Gateway service routing table" });
});

// ── Start HTTP Gateway Server ─────────────────────────────────────────────────
const server = app.listen(PORT, "0.0.0.0", () => {
  console.log(`🌐 API Gateway running on port ${PORT}`);
});

setupGracefulShutdown(server, async () => {
  console.log("[api-gateway] Shutting down gracefully...");
  await disconnectGatewayRedis();
});

export default app as any;
