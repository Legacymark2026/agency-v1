/**
 * CRM Service — Customer Relationship Management Microservice
 * ─────────────────────────────────────────────────────────────────────────────
 * Handles: Leads, Deals, Pipeline, Scoring, Sequences, Commissions, Analytics
 * Port: 4002 (HTTP) | Port: 50052 (gRPC Sync)
 *
 * Fixes applied in this refactor:
 *   C-1: eventBus hoisted & single-instanced via lib/event-bus.singleton.ts
 *   C-2: requireUserOrServiceAuth applied across all domain routers
 *   C-3: Multi-tenant boundary isolation enforced on all entity lookups & mutations
 *   C-4: Zod whitelisting on all routes preventing mass assignment
 *   C-5: Redis & EventBus connection pool shared singleton
 *   A-1 & A-2: 2,515-line God Object refactored into modular domain routers
 */

try { require("@agency/observability/register"); } catch { /* optional */ }
import { setupGracefulShutdown } from "@agency/service-auth";
import { metricsMiddleware, metricsEndpoint } from "@agency/observability";
import { GrpcClientHelper, PROTO_PATHS } from "@agency/grpc";
import { serveServiceDocs } from "@agency/scant";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import path from "path";
import { prisma } from "@agency/database";

// EventBus & Redis Singleton (Fixes C-1 & C-5)
import { eventBus, disconnectEventBusAndRedis } from "./lib/event-bus.singleton";

// Outbox Relay Worker & CQRS
import { startMessageRelayWorker, stopMessageRelayWorker } from "./workers/outbox.worker";

// gRPC Server Setup (Port 50052)
import { startCrmGrpcServer } from "./grpc/crm-grpc.server";

// Domain Routers
import { leadsRouter } from "./routes/leads.routes";
import { dealsRouter } from "./routes/deals.routes";
import { campaignsRouter } from "./routes/campaigns.routes";
import { commissionsRouter } from "./routes/commissions.routes";
import { goalsRouter } from "./routes/goals.routes";
import { sequencesRouter } from "./routes/sequences.routes";
import { tasksRouter } from "./routes/tasks.routes";
import { scoringRouter } from "./routes/scoring.routes";
import { automationsRouter } from "./routes/automations.routes";
import { reportsRouter } from "./routes/reports.routes";
import { teamsRouter } from "./routes/teams.routes";
import { leadRouter as legacyLeadRouter } from "./routes/lead.routes";
import { errorHandler } from "./middlewares/crm.middleware";
import { logger } from "./utils/logger.utils";

const app = express();
const PORT = parseInt(process.env.PORT || "4002", 10);
const CRM_GRPC_PORT = parseInt(process.env.GRPC_PORT || "50052", 10);
const AUTH_GRPC_URL = process.env.AUTH_GRPC_URL || "auth-service:50051";

// ── Observability & Base Middlewares ──────────────────────────────────────────
app.use(metricsMiddleware("crm-service"));
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: "5mb" }));

// ── Interactive API Documentation (Swagger via Scant) ─────────────────────────
app.use("/api/docs", serveServiceDocs(path.resolve(__dirname, "..")));

// ── Health & Readiness Checks ────────────────────────────────────────────────
app.get("/health", (_req, res) => {
  res.json({ status: "healthy", service: "crm-service", timestamp: new Date().toISOString() });
});

app.get("/metrics", metricsEndpoint);

app.get("/ready", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: "ready", db: "connected" });
  } catch (err) {
    res.status(503).json({ status: "not_ready", error: String(err) });
  }
});

// ── Domain Routers (All protected by requireUserOrServiceAuth) ─────────────────
app.use("/api/leads", leadsRouter);
app.use("/api/deals", dealsRouter);
app.use("/api/campaigns", campaignsRouter);
app.use("/api/crm/commissions", commissionsRouter);
app.use("/api/crm/sales/commissions", commissionsRouter);
app.use("/api/crm/goals", goalsRouter);
app.use("/api/crm/sales", goalsRouter);
app.use("/api/crm/sequences", sequencesRouter);
app.use("/api/crm/email-templates", sequencesRouter);
app.use("/api/crm/tasks", tasksRouter);
app.use("/api/crm/scoring", scoringRouter);
app.use("/api/crm/scoring-rules", scoringRouter);
app.use("/api/crm/automation", automationsRouter);
app.use("/api/crm/automations", automationsRouter);
app.use("/api/crm/reports", reportsRouter);
app.use("/api/crm/closing", reportsRouter);
app.use("/api/crm/stats", reportsRouter);
app.use("/api/crm", teamsRouter);

// Legacy v1 router support
app.use("/api/v1", legacyLeadRouter);

// ── Centralized Error Handler ────────────────────────────────────────────────
app.use(errorHandler as any);

// ── Synchronous gRPC Server & Client Setup ─────────────────────────────────────
const crmGrpcServer = startCrmGrpcServer();

export const authGrpcClient = GrpcClientHelper.getClient(
  "auth-service",
  PROTO_PATHS.auth,
  "auth",
  "AuthService",
  AUTH_GRPC_URL,
  { failureThreshold: 3, resetTimeoutMs: 5000, timeoutMs: 3000 }
);

// ── Start Outbox Relay Worker ────────────────────────────────────────────────
startMessageRelayWorker().catch((err) => {
  logger.error("[crm-service] Failed to start outbox worker:", { error: String(err) });
});

// ── Start HTTP Server ────────────────────────────────────────────────────────
const server = app.listen(PORT, "0.0.0.0", () => {
  console.log(`📊 CRM Service running on port ${PORT} (HTTP) and port ${CRM_GRPC_PORT} (gRPC Sync)`);
});

setupGracefulShutdown(server, async () => {
  await stopMessageRelayWorker();
  await crmGrpcServer.forceShutdown();
  await disconnectEventBusAndRedis();
  await prisma.$disconnect();
});

export default app as any;
