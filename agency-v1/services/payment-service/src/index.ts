/**
 * Payment Service — Decoupled Central Payment Microservice (Hexagonal 5.0)
 * ─────────────────────────────────────────────────────────────────────────────
 * Port: 4022 | High concurrency, PCI-DSS compliant, ISO 8583 & Event-Driven Pub/Sub
 */
try {
  require("@agency/observability/register");
} catch {
  /* optional */
}
import { metricsMiddleware, metricsEndpoint } from "@agency/observability";
import { setupGracefulShutdown } from "@agency/service-auth";
import { EventBus } from "@agency/events";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import { PaymentUseCases } from "./core/usecases/payment.usecases";
import { PrismaPaymentPersistenceAdapter } from "./adapters/prisma-payment.adapter";
import { EventBusPaymentPublisherAdapter } from "./adapters/eventbus-payment.adapter";
import { createPaymentRouter } from "./routes/payment.routes";
import { pciDssSanitizerMiddleware } from "./middlewares/sanitizer.middleware";
import { idempotencyMiddleware } from "./middlewares/idempotency.middleware";

const app = express();
const PORT = parseInt(process.env.PORT || "4022", 10);
const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

app.use(metricsMiddleware("payment-service"));
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: "5mb" }));
app.use(pciDssSanitizerMiddleware);
app.use(idempotencyMiddleware);

// ── Hexagonal Dependency Injection ───────────────────────────────────────────
const persistenceAdapter = new PrismaPaymentPersistenceAdapter();
const eventBus = new EventBus(REDIS_URL, "payment-service");
const publisherAdapter = new EventBusPaymentPublisherAdapter(eventBus);
export const paymentUseCases = new PaymentUseCases(persistenceAdapter, publisherAdapter);

// ── Observability & Health ───────────────────────────────────────────────────
app.get("/metrics", metricsEndpoint);

app.get("/health", (_req, res) => {
  res.json({
    status: "healthy",
    service: "payment-service",
    architecture: "Hexagonal 5.0",
    port: PORT,
    timestamp: new Date().toISOString(),
  });
});

app.get("/ready", (_req, res) => {
  res.json({ status: "ready", service: "payment-service" });
});

// ── Payment Inbound Router ───────────────────────────────────────────────────
app.use("/api/payments", createPaymentRouter(paymentUseCases));
app.use("/api/v1/payments", createPaymentRouter(paymentUseCases));

const server = app.listen(PORT, "0.0.0.0", () => {
  console.log(`💳 Payment Microservice running (Hexagonal 5.0) on port ${PORT}`);
});

setupGracefulShutdown(server, async () => {
  console.log("[payment-service] Shutting down gracefully...");
});

export default app;
