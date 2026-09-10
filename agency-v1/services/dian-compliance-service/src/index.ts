/**
 * DIAN Compliance Service — Hexagonal 5.0 Entrypoint
 * Port: 4026
 */
import express from "express";
import cors from "cors";
import helmet from "helmet";
import { metricsMiddleware, metricsEndpoint } from "@agency/observability";
import { setupGracefulShutdown } from "@agency/service-auth";
import { EventBus } from "@agency/events";
import { PrismaDianAdapter } from "./adapters/dian-db.adapter";
import { RedisDianEventAdapter } from "./adapters/dian-event.adapter";
import { DianComplianceUseCases } from "./core/usecases/dian.usecases";
import { createDianRouter } from "./routes/dian.routes";

const app = express();
const PORT = process.env.PORT || 4026;
const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";
const eventBus = new EventBus(REDIS_URL, "dian-compliance-service");

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(metricsMiddleware("dian-compliance-service"));
app.get("/metrics", metricsEndpoint);

const dbAdapter = new PrismaDianAdapter();
const eventAdapter = new RedisDianEventAdapter();
const useCases = new DianComplianceUseCases(dbAdapter, eventAdapter);

app.use("/api/dian", createDianRouter(useCases, dbAdapter));

app.get("/health", (_req, res) => {
  res.json({ status: "healthy", service: "dian-compliance-service", timestamp: new Date() });
});

// Event listener: automatically emit electronic invoice when an invoice is issued
eventBus.subscribe("invoice.issued" as any, async (event: any) => {
  try {
    if (event.invoiceId && event.subtotal) {
      await useCases.emitElectronicInvoice({
        companyId: event.companyId || "default",
        prefix: "SETP",
        emitterNit: event.emitterNit || "901234567-8",
        emitterName: event.emitterName || "EMPRESA SAS",
        receiverNit: event.clientNit || "222222222222",
        receiverName: event.clientName || "CONSUMIDOR FINAL",
        subtotal: event.subtotal,
        vatAmount: event.vatAmount || 0,
        items: event.items || [{ name: "Servicios comerciales", quantity: 1, unitPrice: event.subtotal, subtotal: event.subtotal }],
      });
    }
  } catch (err: any) {
    console.warn("[DianComplianceService] Failed to auto-emit invoice from event:", err.message);
  }
}).catch((err: any) => console.warn("[DianComplianceService] EventBus subscribe warning:", err));

const server = app.listen(PORT, () => {
  console.log(`[dian-compliance-service] Listening on port ${PORT}`);
});

setupGracefulShutdown(server, async () => {
  await eventBus.disconnect();
});

export default app;
