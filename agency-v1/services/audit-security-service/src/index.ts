/**
 * Audit Security Service — Hexagonal 5.0 Entrypoint
 * Port: 4030
 */
import express from "express";
import cors from "cors";
import helmet from "helmet";
import { metricsMiddleware, metricsEndpoint } from "@agency/observability";
import { setupGracefulShutdown } from "@agency/service-auth";
import { PrismaAuditAdapter } from "./adapters/audit-db.adapter";
import { AuditSecurityUseCases } from "./core/usecases/audit.usecases";
import { createAuditRouter } from "./routes/audit.routes";

import { EventBus } from "@agency/events";
import { prisma } from "@agency/database";

const app = express();
const PORT = process.env.PORT || 4030;
const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";
const eventBus = new EventBus(REDIS_URL, "audit-security-service");

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(metricsMiddleware("audit-security-service"));
app.get("/metrics", metricsEndpoint);

const dbAdapter = new PrismaAuditAdapter();
const useCases = new AuditSecurityUseCases(dbAdapter);

app.use("/api/audit", createAuditRouter(useCases, dbAdapter));

app.get("/health", (_req, res) => {
  res.json({ status: "healthy", service: "audit-security-service", timestamp: new Date() });
});

// Interceptar eventos clave del sistema para bitácora criptográfica WORM
eventBus.subscribe("pos.order.created" as any, async (event: any) => {
  try {
    await useCases.logEvent({
      companyId: event.companyId || "default",
      actorId: event.openedById || "pos-system",
      actorEmail: "pos-terminal@legacymark.internal",
      actorRole: "system",
      action: "CREATE",
      resource: "POS",
      resourceId: event.orderId,
      details: { total: event.total, itemsCount: event.items?.length || 0 },
    });
  } catch (err: any) {
    console.warn("[AuditSecurityService] Error auditando pos.order.created:", err.message);
  }
}).catch((err: any) => console.warn("[AuditSecurityService] EventBus subscribe warning:", err));

eventBus.subscribe("invoice.issued" as any, async (event: any) => {
  try {
    await useCases.logEvent({
      companyId: event.companyId || "default",
      actorId: event.issuerId || "billing-system",
      actorEmail: "billing@legacymark.internal",
      actorRole: "system",
      action: "CREATE",
      resource: "INVOICE",
      resourceId: event.invoiceId,
      details: { subtotal: event.subtotal, vatAmount: event.vatAmount },
    });
  } catch (err: any) {
    console.warn("[AuditSecurityService] Error auditando invoice.issued:", err.message);
  }
}).catch((err: any) => console.warn("[AuditSecurityService] EventBus subscribe warning:", err));

const server = app.listen(PORT, () => {
  console.log(`[audit-security-service] Listening on port ${PORT}`);
});

setupGracefulShutdown(server, async () => {
  console.log("[audit-security-service] Shutting down cleanly...");
  await eventBus.disconnect();
  try {
    await (prisma as any).$disconnect();
  } catch (err: any) {
    console.warn("[audit-security-service] Error disconnecting prisma:", err.message);
  }
});

export default app;
