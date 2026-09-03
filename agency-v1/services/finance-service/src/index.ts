/**
 * Finance Service — Billing, Payroll & Accounting Microservice
 * Port: 4006 | High data criticality
 *
 * Fixes applied in this rewrite:
 *   C-1  eventBus hoisting — declared at module top, before any handler
 *   C-2  Auth — requireUserOrServiceAuth applied via domain routers
 *   C-3  Stripe webhook — webhooksRouter mounted BEFORE express.json() (raw body preserved)
 *   A-1  God Object — 776 lines → 80 lines; logic moved to 7 domain routers
 *   A-2  Duplicate routes — /api/v1/* and /api/* unified under single router tree
 *   M-3  EventBus singleton — single instance from lib/event-bus.singleton.ts
 */
try { require("@agency/observability/register"); } catch { /* optional */ }
import { metricsMiddleware, metricsEndpoint } from "@agency/observability";
import { setupGracefulShutdown, requireUserOrServiceAuth } from "@agency/service-auth";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import { prisma } from "@agency/database";

// C-1 Fix: eventBus declared at top — before any handler references it
import { eventBus } from "./lib/event-bus.singleton";

// Domain routers
import { invoicesRouter } from "./routes/invoices.routes";
import { expensesRouter } from "./routes/expenses.routes";
import { paymentsRouter } from "./routes/payments.routes";
import { payrollRouter } from "./routes/payroll.routes";
import { subscriptionsRouter } from "./routes/subscriptions.routes";
import { cronRouter } from "./routes/cron.routes";
// C-3 Fix: webhooksRouter uses express.raw() internally — must mount BEFORE express.json()
import { webhooksRouter } from "./routes/webhooks.routes";
// Legacy v1 router (kept for backward compatibility during migration)
import { financeRouter } from "./routes/finance.routes";
import { accountingRouter } from "./routes/accounting.routes";
import { errorHandler } from "./middlewares/finance.middleware";

const app = express();
const PORT = parseInt(process.env.PORT || "4006", 10);

// ── Observability ──────────────────────────────────────────────────────────────
app.use(metricsMiddleware("finance-service"));
app.get("/metrics", metricsEndpoint);

// ── Security headers ───────────────────────────────────────────────────────────
app.use(helmet());
app.use(cors());

// ── Health & Readiness (no auth required) ─────────────────────────────────────
app.get("/health", (_req, res) => {
  res.json({ status: "healthy", service: "finance-service" });
});
app.get("/ready", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: "ready" });
  } catch (err) {
    res.status(503).json({ status: "not_ready", error: String(err) });
  }
});

// ── C-3 Fix: Webhook routes BEFORE express.json() ─────────────────────────────
// webhooksRouter mounts express.raw() per-route for Stripe — must be here
app.use("/api/webhooks", webhooksRouter);

// ── Body parsing (after webhook routes) ───────────────────────────────────────
app.use(express.json({ limit: "5mb" }));

// ── Domain routers (all protected by requireUserOrServiceAuth internally) ──────
app.use("/api/invoices", invoicesRouter);
app.use("/api/expenses", expensesRouter);
app.use("/api/payments", paymentsRouter);
app.use("/api/payroll", payrollRouter);
app.use("/api/subscriptions", subscriptionsRouter);
app.use("/api/cron", cronRouter);
app.use("/api/accounting", accountingRouter);
app.use("/api/v1/accounting", accountingRouter);

// ── Legacy /api/v1 router (v1 clients — keep during deprecation window) ────────
app.use("/api/v1", requireUserOrServiceAuth, financeRouter);

// ── Global error handler ───────────────────────────────────────────────────────
app.use(errorHandler);

// ── Server startup ─────────────────────────────────────────────────────────────
const server = app.listen(PORT, "0.0.0.0", () => {
  console.log(`💰 Finance Service running on port ${PORT}`);
});

setupGracefulShutdown(server, async () => {
  await eventBus.disconnect();
  await prisma.$disconnect();
});

// EventBus subscriptions for decoupled domain coordination
eventBus.subscribe("invoice.paid", async (data) => {
  console.log(`[finance-service] invoice.paid event received`, { invoiceId: (data as any).invoiceId });
}).catch((err) => console.warn("[finance-service] EventBus subscribe warning:", err));

eventBus.subscribe("payment.succeeded", async (data: any) => {
  console.log(`[finance-service] payment.succeeded event received:`, data);
  try {
    if (data.invoiceId) {
      await prisma.invoice.update({
        where: { id: data.invoiceId },
        data: { status: "PAID" },
      });
      console.log(`[finance-service] Auto-marked invoice ${data.invoiceId} as PAID from payment event`);
    }
  } catch (err: any) {
    console.warn("[finance-service] Error handling payment.succeeded:", err.message);
  }
}).catch((err) => console.warn("[finance-service] EventBus payment.succeeded subscribe warning:", err));

export default app as any;
