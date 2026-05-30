import express, { Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import { prisma } from "@agency/database";
import { trackClick } from "./controllers/click.controller";
import { processPayout } from "./controllers/payout.controller";
import { startEventConsumers } from "./events/consumer";
import { startReferralReleaseScheduler, releaseReferrals } from "./cron/release-referrals";

const app = express();
const PORT = parseInt(process.env.PORT || "4019", 10);

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: "10mb" }));

// ── Health & Readiness Check ──────────────────────────────────────────────────
app.get("/health", (_req: Request, res: Response) => {
  res.json({
    status: "healthy",
    service: "affiliate-service",
    version: "1.0.0",
    timestamp: new Date().toISOString()
  });
});

app.get("/ready", async (_req: Request, res: Response) => {
  try {
    // Probar conexión a la base de datos
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: "ready", db: "connected" });
  } catch (err) {
    res.status(503).json({ status: "not_ready", error: String(err) });
  }
});

// ── Redirección & Analíticas de Enlaces ─────────────────────────────────────────
app.get("/r/:code", trackClick);

// ── Liquidación de Comisiones (Payouts) ─────────────────────────────────────────
app.post("/api/affiliates/payouts", processPayout);

// ── Ejecución Manual de Tareas Programadas (Testing) ───────────────────────────
app.post("/api/affiliates/cron/release", async (req: Request, res: Response) => {
  try {
    const warrantyDays = req.body.warrantyDays ? parseInt(req.body.warrantyDays, 10) : 15;
    const result = await releaseReferrals(warrantyDays);
    res.json({ success: true, ...result });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ── Inicializar Consumidores & Cron Jobs ──────────────────────────────────────
startEventConsumers();
startReferralReleaseScheduler();

// ── Arrancar Servidor ────────────────────────────────────────────────────────
const server = app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Affiliate Service listening at http://localhost:${PORT}`);
});

process.on("SIGTERM", async () => {
  console.log("SIGTERM received. Shutting down...");
  server.close(async () => {
    await prisma.$disconnect();
    console.log("Database disconnected. Server closed.");
    process.exit(0);
  });
});
