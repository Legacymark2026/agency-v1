/**
 * AI Engine — Agent Intelligence Microservice
 * ─────────────────────────────────────────────────────────────────────────────
 * Handles: AI Agents, ReFRAG, Knowledge Bases, Agent Teams, Memory, Embeddings
 * Port: 4004 (HTTP)
 *
 * Fixes applied in this refactor:
 *   C-1: All endpoints secured with requireUserOrServiceAuth
 *   C-2: Unification of agent invocation into modular domain routers
 *   C-3: Multi-tenant boundary isolation enforced on all agents & knowledge bases
 *   C-4: Shared EventBus & Redis singleton in lib/event-bus.singleton.ts
 *   C-5: Static model provider registry avoiding dynamic require() in hot loop
 *   A-1 & A-2: Monolith refactored into modular domain routers
 */

try { require("@agency/observability/register"); } catch { /* optional */ }
import { metricsMiddleware, metricsEndpoint } from "@agency/observability";
import { setupGracefulShutdown, tenantContextMiddleware, globalErrorHandler } from "@agency/service-auth";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import { prisma } from "@agency/database";

// EventBus & Redis Singleton (Fix C-4)
import { eventBus, disconnectAiEventBusAndRedis } from "./lib/event-bus.singleton";

// Domain Routers (All protected by requireUserOrServiceAuth)
import { agentsRouter } from "./routes/agents.routes";
import { knowledgeRouter } from "./routes/knowledge.routes";
import { governanceRouter } from "./routes/governance.routes";
import { errorHandler } from "./middlewares/ai.middleware";

const app = express();
const PORT = parseInt(process.env.PORT || "4004", 10);

// ── Observability & Base Middlewares ──────────────────────────────────────────
app.use(metricsMiddleware("ai-engine"));
app.use(helmet());
app.use(cors());
app.use(tenantContextMiddleware);
app.use(express.json({ limit: "10mb" }));

// ── Health & Readiness Checks ────────────────────────────────────────────────
app.get("/health", (_req, res) => {
  res.json({ status: "healthy", service: "ai-engine", timestamp: new Date().toISOString() });
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
app.use("/api", agentsRouter);
app.use("/api", knowledgeRouter);
app.use("/api", governanceRouter);

app.use("/api/v1", agentsRouter);
app.use("/api/v1", knowledgeRouter);
app.use("/api/v1", governanceRouter);

// ── Centralized Error Handler ────────────────────────────────────────────────
app.use(errorHandler);

// ── Event Bus Subscriptions ──────────────────────────────────────────────────
import { AiService } from "./services/ai.service";
eventBus.subscribe("message.received", async (payload: any) => {
  try {
    const data = payload.data || payload;
    if (data.messageId && data.text) {
      console.log(`[ai-engine] Processing message: ${data.messageId}`);
      
      const response = await AiService.runAgent({
        agentId: "default-sales-agent",
        companyId: data.companyId || "default",
        userMessage: data.text,
        conversationId: data.conversationId || data.messageId,
      });

      await eventBus.publish("ai.response.generated", {
        messageId: data.messageId,
        companyId: data.companyId,
        response: response?.finalResponse || "Gracias por tu mensaje. Un asesor te contactará pronto.",
        conversationId: data.conversationId,
        channel: data.channel
      });
      console.log(`[ai-engine] Generated and published AI response for ${data.messageId}`);
    }
  } catch (err: any) {
    console.error(`[ai-engine] Error processing message.received: ${err.message}`);
  }
});

eventBus.subscribe("workflow.ai_step", async (payload: any) => {
  if (payload?.data?.stepId) {
    console.log(`[ai-engine] Workflow AI step triggered: ${payload.data.stepId}`);
  }
});

// ── Start HTTP Server ────────────────────────────────────────────────────────
app.use(globalErrorHandler);
const server = app.listen(PORT, "0.0.0.0", () => {
  console.log(`🧠 AI Engine running on port ${PORT}`);
});

setupGracefulShutdown(server, async () => {
  console.log("[ai-engine] Shutting down gracefully...");
  await disconnectAiEventBusAndRedis();
  await prisma.$disconnect();
});

export default app as any;

