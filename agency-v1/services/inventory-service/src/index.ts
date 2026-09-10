/**
 * Inventory Microservice — Hexagonal 5.0 Entrypoint
 * Port: 4025
 */
import express from "express";
import cors from "cors";
import helmet from "helmet";
import { metricsMiddleware, metricsEndpoint } from "@agency/observability";
import { setupGracefulShutdown } from "@agency/service-auth";
import { EventBus } from "@agency/events";
import { PrismaInventoryAdapter } from "./adapters/inventory-db.adapter";
import { RedisInventoryEventAdapter } from "./adapters/inventory-event.adapter";
import { InventoryUseCases } from "./core/usecases/inventory.usecases";
import { createInventoryRouter } from "./routes/inventory.routes";

const app = express();
const PORT = process.env.PORT || 4025;
const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";
const eventBus = new EventBus(REDIS_URL, "inventory-service");

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(metricsMiddleware("inventory-service"));
app.get("/metrics", metricsEndpoint);

const dbAdapter = new PrismaInventoryAdapter();
const eventAdapter = new RedisInventoryEventAdapter();
const useCases = new InventoryUseCases(dbAdapter, eventAdapter);

app.use("/api/inventory", createInventoryRouter(useCases, dbAdapter));

app.get("/health", (_req, res) => {
  res.json({ status: "healthy", service: "inventory-service", timestamp: new Date() });
});

// Event subscription: automatically decrement inventory when POS sale completes
eventBus.subscribe("pos.order.created" as any, async (event: any) => {
  try {
    if (event.items && Array.isArray(event.items)) {
      for (const item of event.items) {
        if (item.productId && item.warehouseId) {
          await useCases.registerStockExit({
            companyId: event.companyId,
            warehouseId: item.warehouseId,
            productId: item.productId,
            quantity: item.quantity,
            reference: `POS-${event.orderId}`,
            note: "Venta directa en POS",
          });
        }
      }
    }
  } catch (err: any) {
    console.warn("[InventoryService] Failed to auto-decrement POS sale stock:", err.message);
  }
}).catch((err: any) => console.warn("[InventoryService] EventBus subscribe warning:", err));

const server = app.listen(PORT, () => {
  console.log(`[inventory-service] Listening on port ${PORT}`);
});

setupGracefulShutdown(server, async () => {
  await eventBus.disconnect();
});

export default app;
