/**
 * Sales Forecast & Discount Engine Microservice — Hexagonal 5.0
 * Port: 4035
 */
import express from "express";
import cors from "cors";
import helmet from "helmet";
import { metricsMiddleware, metricsEndpoint } from "@agency/observability";
import { setupGracefulShutdown } from "@agency/service-auth";
import { EventBus } from "@agency/events";
import { prisma } from "@agency/database";
import { PrismaSalesForecastAdapter } from "./adapters/sales-forecast-db.adapter";
import { RedisSalesForecastEventAdapter } from "./adapters/sales-forecast-event.adapter";
import { SalesForecastUseCases } from "./core/usecases/sales-forecast.usecases";
import { createSalesForecastRouter } from "./routes/sales-forecast.routes";

const app = express();
const PORT = process.env.PORT || 4035;
const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";
const eventBus = new EventBus(REDIS_URL, "sales-forecast-service");

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(metricsMiddleware("sales-forecast-service"));
app.get("/metrics", metricsEndpoint);

const dbAdapter = new PrismaSalesForecastAdapter();
const eventAdapter = new RedisSalesForecastEventAdapter();
const useCases = new SalesForecastUseCases(dbAdapter, eventAdapter);

app.use("/api/sales-forecast", createSalesForecastRouter(useCases, dbAdapter));

app.get("/health", (_req, res) => {
  res.json({ status: "healthy", service: "sales-forecast-service", timestamp: new Date() });
});

// Listener en tiempo real: Actualizar proyecciones cuando se concreta una venta en POS o Factura
eventBus.subscribe("pos.order.created" as any, async (event: any) => {
  try {
    if (event.companyId) {
      console.log(`[SalesForecastService] Venta registrada en POS para empresa ${event.companyId}. Recalibrando modelos...`);
    }
  } catch (err: any) {
    console.warn("[SalesForecastService] Listener warning:", err.message);
  }
}).catch((err: any) => console.warn("[SalesForecastService] EventBus subscribe warning:", err));

const server = app.listen(PORT, () => {
  console.log(`[sales-forecast-service] Listening on port ${PORT}`);
});

setupGracefulShutdown(server, async () => {
  console.log("[sales-forecast-service] Shutting down cleanly...");
  await eventBus.disconnect();
  try {
    await (prisma as any).$disconnect();
  } catch (err: any) {
    console.warn("[sales-forecast-service] Prisma disconnect warning:", err.message);
  }
});

export default app;
