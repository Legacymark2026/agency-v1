/**
 * Payment Service — Decoupled Central Payment Microservice
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
import express from "express";
import cors from "cors";
import helmet from "helmet";
import { paymentRouter } from "./routes/payment.routes";

const app = express();
const PORT = parseInt(process.env.PORT || "4022", 10);

app.use(metricsMiddleware("payment-service"));
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: "5mb" }));

// ── Observability & Health ───────────────────────────────────────────────────
app.get("/metrics", metricsEndpoint);

app.get("/health", (_req, res) => {
  res.json({
    status: "healthy",
    service: "payment-service",
    port: PORT,
    timestamp: new Date().toISOString(),
  });
});

app.get("/ready", (_req, res) => {
  res.json({ status: "ready", service: "payment-service" });
});

// ── Payment Routes ───────────────────────────────────────────────────────────
app.use("/api/payments", paymentRouter);
app.use("/api/v1/payments", paymentRouter);

const server = app.listen(PORT, "0.0.0.0", () => {
  console.log(`💳 Payment Microservice running decoupled on port ${PORT}`);
});

setupGracefulShutdown(server, async () => {
  console.log("[payment-service] Shutting down gracefully...");
});

export default app;
