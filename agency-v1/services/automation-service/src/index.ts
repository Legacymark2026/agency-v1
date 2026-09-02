/**
 * Automation Service — Workflow Engine & Marketing Microservice
 * ─────────────────────────────────────────────────────────────────────────────
 * Handles: Workflows, Campaigns, Social Publishing, Email Blasts, CAPI
 * Port: 4003 (HTTP)
 *
 * Fixes applied in this refactor:
 *   C-1: requireUserOrServiceAuth applied across all business routes
 *   C-2: Strict multi-tenant isolation on workflows CRUD & bulk deletions
 *   C-3: Fixed Prisma schema column name (scheduledAt) for social post publishing
 *   C-4: CRON_SECRET authentication on scheduled cron endpoints
 *   C-5: Consolidated EventBus & Redis singleton in lib/event-bus.singleton.ts
 *   A-1 & A-2: 495-line God Object refactored into clean modular routers
 */

try { require("@agency/observability/register"); } catch { /* optional */ }
import { metricsMiddleware, metricsEndpoint } from "@agency/observability";
import { setupGracefulShutdown } from "@agency/service-auth";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import { prisma } from "@agency/database";

// EventBus & Redis Singleton (Fix C-5)
import { eventBus, disconnectAutomationEventBusAndRedis } from "./lib/event-bus.singleton";

// Domain Routers
import { workflowsRouter } from "./routes/workflows.routes";
import { executionsRouter } from "./routes/executions.routes";
import { cronRouter } from "./routes/cron.routes";
import { integrationsRouter } from "./routes/integrations.routes";
import { errorHandler } from "./middlewares/automation.middleware";
import { WebhookIntegrationService } from "./services/webhook-integration.service";
import { triggerWorkflow } from "./workflow-executor";

const app = express();
const PORT = parseInt(process.env.PORT || "4003", 10);

// ── Observability & Base Middlewares ──────────────────────────────────────────
app.use(metricsMiddleware("automation-service"));
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: "10mb" }));

// ── Health & Readiness Checks ────────────────────────────────────────────────
app.get("/health", (_req, res) => {
  res.json({ status: "healthy", service: "automation-service", timestamp: new Date().toISOString() });
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

// ── Domain Routers ────────────────────────────────────────────────────────────
// Mount to /api and /api/v1 for complete backward compatibility
app.use("/api", workflowsRouter);
app.use("/api", executionsRouter);
app.use("/api", cronRouter);
app.use("/api", integrationsRouter);

app.use("/api/v1", workflowsRouter);
app.use("/api/v1", executionsRouter);
app.use("/api/v1", cronRouter);
app.use("/api/v1", integrationsRouter);

// ── Centralized Error Handler ────────────────────────────────────────────────
app.use(errorHandler);

// ── Event Bus Subscriptions ──────────────────────────────────────────────────
eventBus.subscribe("lead.created", async (payload: any) => {
  const data = payload.data || {};
  console.log(`[automation-service] Reacting to lead.created: ${data.leadId || data.id}`);

  try {
    await WebhookIntegrationService.triggerIntegrationsForEvent(
      String(data.companyId || "system-fallback"),
      "lead.created",
      data
    );
  } catch (err: any) {
    console.error("[automation-service] Webhook dispatch fail on lead.created:", err.message);
  }
});

eventBus.subscribe("deal.stage_changed", async (payload: any) => {
  const data = (payload.data || {}) as { dealId: string; stage: string; companyId: string };
  console.log(`[automation-service] Deal stage changed: ${data.dealId} to stage: ${data.stage}`);

  try {
    await WebhookIntegrationService.triggerIntegrationsForEvent(
      data.companyId || "system-fallback",
      "deal.stage_changed",
      data
    );
  } catch (err: any) {
    console.error("[automation-service] Webhook dispatch fail on deal.stage_changed:", err.message);
  }

  try {
    const result = await triggerWorkflow("DEAL_STAGE_CHANGED", {
      id: data.dealId,
      dealId: data.dealId,
      stage: data.stage,
      companyId: data.companyId,
      __dealId: data.dealId,
    });
    console.log(`[automation-service] Event trigger DEAL_STAGE_CHANGED executed: ${result.executed} workflows.`);
  } catch (err) {
    console.error("[automation-service] Failed to trigger workflow on deal.stage_changed:", err);
  }
});

// ── Start HTTP Server ────────────────────────────────────────────────────────
const server = app.listen(PORT, "0.0.0.0", () => {
  console.log(`⚡ Automation Service running on port ${PORT}`);
});

setupGracefulShutdown(server, async () => {
  console.log("[automation-service] Shutting down gracefully...");
  await disconnectAutomationEventBusAndRedis();
  await prisma.$disconnect();
});

export default app as any;
