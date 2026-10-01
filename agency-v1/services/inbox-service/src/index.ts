/**
 * Inbox Service — OmniChannel Communication Microservice
 * Port: 4005 | Sticky Sessions Required (WebSocket)
 *
 * Architecture:
 *  - Authentication:  requireUserOrServiceAuth (x-user-id | x-service-token)
 *  - Business routes: /api/inbox/** → domain routers (conversations, messages, sla, macros)
 *  - Webhook routes:  /api/webhooks/** → HMAC-verified (no JWT)
 *  - Observability:   /health, /ready, /metrics
 */
try { require("@agency/observability/register"); } catch { /* optional */ }

import { metricsMiddleware, metricsEndpoint } from "@agency/observability";
import { setupGracefulShutdown, tenantContextMiddleware, globalErrorHandler } from "@agency/service-auth";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import { prisma } from "@agency/database";
import { EventBus } from "@agency/events";

// ── Local routers ─────────────────────────────────────────────────────────────
import { createConversationsRouter } from "./routes/conversations.routes";
import { createMessagesRouter } from "./routes/messages.routes";
import { createSlaRouter } from "./routes/sla.routes";
import { createMacrosRouter } from "./routes/macros.routes";
import { createWebhooksRouter } from "./routes/webhooks.routes";
import { errorHandler } from "./middlewares/inbox.middleware";

// ── FIX #4: EventBus declared FIRST — before any route handler can reference it
const PORT = parseInt(process.env.PORT || "4005", 10);
const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";
const eventBus = new EventBus(REDIS_URL, "inbox-service");

// ── App setup ─────────────────────────────────────────────────────────────────
const app = express();
app.use(metricsMiddleware("inbox-service"));
app.get("/metrics", metricsEndpoint);
app.use(helmet());
app.use(cors());
app.use(tenantContextMiddleware);
app.use(express.json({ limit: "10mb" }));

// ── Health & Readiness ────────────────────────────────────────────────────────
app.get("/health", (_req, res) => {
  res.json({ status: "healthy", service: "inbox-service" });
});

app.get("/ready", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: "ready" });
  } catch (err) {
    res.status(503).json({ status: "not_ready", error: String(err) });
  }
});

// ── Route versioning: rewrite /api/v1/* → /api/* (backward-compat shim) ──────
app.use((req, _res, next) => {
  if (req.url.startsWith("/api/v1/inbox")) {
    req.url = req.url.replace("/api/v1/inbox", "/api/inbox");
  } else if (req.url.startsWith("/api/v1/webhooks")) {
    req.url = req.url.replace("/api/v1/webhooks", "/api/webhooks");
  }
  next();
});

// ── Business routes (FIX #2: all protected by requireUserOrServiceAuth) ───────
app.use("/api/inbox", createConversationsRouter(eventBus));
app.use("/api/inbox", createMessagesRouter(eventBus));
app.use("/api/inbox", createSlaRouter());
app.use("/api/inbox", createMacrosRouter());

// ── Webhook routes (FIX #3: HMAC-verified, NOT JWT) ──────────────────────────
app.use("/api/webhooks", createWebhooksRouter(eventBus));

// ── Global error handler ──────────────────────────────────────────────────────
app.use(errorHandler);

// ── EventBus subscriptions ────────────────────────────────────────────────────
import { InboxService } from "./services/inbox.service";
eventBus.subscribe("ai.response.generated", async (payload: any) => {
  const data = payload.data || payload;
  if (data.response && data.conversationId) {
    console.log(`[inbox-service] AI response ready for conv ${data.conversationId}, sending out...`);
    try {
      await InboxService.sendMessage({
        companyId: data.companyId || "default",
        conversationId: data.conversationId,
        senderType: "AGENT",
        text: data.response
      });
      console.log(`[inbox-service] Successfully dispatched AI response for conv ${data.conversationId}`);
    } catch (err: any) {
      console.error(`[inbox-service] Error sending AI response: ${err.message}`);
    }
  }
});

// ── Server bootstrap ──────────────────────────────────────────────────────────
app.use(globalErrorHandler);
const server = app.listen(PORT, "0.0.0.0", () => {
  console.log(`💬 Inbox Service running on port ${PORT}`);
});

setupGracefulShutdown(server, async () => {
  await eventBus.disconnect();
  await prisma.$disconnect();
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default app as any;

