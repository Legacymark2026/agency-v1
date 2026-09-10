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

const app = express();
const PORT = process.env.PORT || 4030;

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

const server = app.listen(PORT, () => {
  console.log(`[audit-security-service] Listening on port ${PORT}`);
});

setupGracefulShutdown(server, async () => {
  console.log("[audit-security-service] Shutting down cleanly...");
});

export default app;
