"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.paymentUseCases = void 0;
/**
 * Payment Service — Decoupled Central Payment Microservice (Hexagonal 5.0)
 * ─────────────────────────────────────────────────────────────────────────────
 * Port: 4022 | High concurrency, PCI-DSS compliant, ISO 8583 & Event-Driven Pub/Sub
 */
try {
    require("@agency/observability/register");
}
catch {
    /* optional */
}
const observability_1 = require("@agency/observability");
const service_auth_1 = require("@agency/service-auth");
const events_1 = require("@agency/events");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const payment_usecases_1 = require("./core/usecases/payment.usecases");
const prisma_payment_adapter_1 = require("./adapters/prisma-payment.adapter");
const eventbus_payment_adapter_1 = require("./adapters/eventbus-payment.adapter");
const payment_routes_1 = require("./routes/payment.routes");
const settings_routes_1 = require("./routes/settings.routes");
const sanitizer_middleware_1 = require("./middlewares/sanitizer.middleware");
const idempotency_middleware_1 = require("./middlewares/idempotency.middleware");
const outbox_service_1 = require("./services/outbox.service");
// Ensure gateways are registered
require("./adapters/stripe.adapter");
require("./adapters/wompi.adapter");
require("./adapters/paypal.adapter");
require("./adapters/bold.adapter");
const app = (0, express_1.default)();
const PORT = parseInt(process.env.PORT || "4022", 10);
const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";
app.use((0, observability_1.metricsMiddleware)("payment-service"));
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)());
app.use(express_1.default.json({ limit: "5mb" }));
app.use(sanitizer_middleware_1.pciDssSanitizerMiddleware);
app.use(idempotency_middleware_1.idempotencyMiddleware);
// ── Hexagonal Dependency Injection ───────────────────────────────────────────
const persistenceAdapter = new prisma_payment_adapter_1.PrismaPaymentPersistenceAdapter();
const eventBus = new events_1.EventBus(REDIS_URL, "payment-service");
const publisherAdapter = new eventbus_payment_adapter_1.EventBusPaymentPublisherAdapter(eventBus);
exports.paymentUseCases = new payment_usecases_1.PaymentUseCases(persistenceAdapter, publisherAdapter);
// ── Observability & Health ───────────────────────────────────────────────────
app.get("/metrics", observability_1.metricsEndpoint);
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
app.use("/api/payments", (0, payment_routes_1.createPaymentRouter)(exports.paymentUseCases));
app.use("/api/v1/payments/settings", settings_routes_1.settingsRouter);
app.use("/api/v1/payments", (0, payment_routes_1.createPaymentRouter)(exports.paymentUseCases));
const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`💳 Payment Microservice running (Hexagonal 5.0) on port ${PORT}`);
});
(0, service_auth_1.setupGracefulShutdown)(server, async () => {
    console.log("[payment-service] Shutting down gracefully...");
});
// ── Transactional Outbox Recovery Poller ─────────────────────────────────────
const OUTBOX_POLL_INTERVAL_MS = 30_000; // every 30 seconds
setInterval(async () => {
    try {
        const processed = await outbox_service_1.TransactionalOutboxService.processPendingOutboxQueue(25);
        if (processed > 0) {
            console.log(`[Outbox] Recovered ${processed} pending payment events.`);
        }
    }
    catch (err) {
        console.warn("[Outbox] Poller sweep error:", err.message);
    }
}, OUTBOX_POLL_INTERVAL_MS).unref(); // .unref() so it doesn't block graceful shutdown
// ── Auto-Reconciliation Worker ───────────────────────────────────────────────
const reconciliation_service_1 = require("./services/reconciliation.service");
const RECONCILIATION_INTERVAL_MS = 10 * 60 * 1000; // 10 minutes
setInterval(() => {
    reconciliation_service_1.ReconciliationWorker.runReconciliationSweep().catch(console.error);
}, RECONCILIATION_INTERVAL_MS).unref();
exports.default = app;
