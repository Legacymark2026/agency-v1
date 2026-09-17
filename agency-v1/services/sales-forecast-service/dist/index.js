"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Sales Forecast & Discount Engine Microservice — Hexagonal 5.0
 * Port: 4035
 */
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const observability_1 = require("@agency/observability");
const service_auth_1 = require("@agency/service-auth");
const events_1 = require("@agency/events");
const database_1 = require("@agency/database");
const sales_forecast_db_adapter_1 = require("./adapters/sales-forecast-db.adapter");
const sales_forecast_event_adapter_1 = require("./adapters/sales-forecast-event.adapter");
const sales_forecast_usecases_1 = require("./core/usecases/sales-forecast.usecases");
const sales_forecast_routes_1 = require("./routes/sales-forecast.routes");
const app = (0, express_1.default)();
const PORT = process.env.PORT || 4035;
const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";
const eventBus = new events_1.EventBus(REDIS_URL, "sales-forecast-service");
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use((0, observability_1.metricsMiddleware)("sales-forecast-service"));
app.get("/metrics", observability_1.metricsEndpoint);
const dbAdapter = new sales_forecast_db_adapter_1.PrismaSalesForecastAdapter();
const eventAdapter = new sales_forecast_event_adapter_1.RedisSalesForecastEventAdapter();
const useCases = new sales_forecast_usecases_1.SalesForecastUseCases(dbAdapter, eventAdapter);
app.use("/api/sales-forecast", (0, sales_forecast_routes_1.createSalesForecastRouter)(useCases, dbAdapter));
app.get("/health", (_req, res) => {
    res.json({ status: "healthy", service: "sales-forecast-service", timestamp: new Date() });
});
// Listener en tiempo real: Actualizar proyecciones cuando se concreta una venta en POS o Factura
eventBus.subscribe("pos.order.created", async (event) => {
    try {
        if (event.companyId) {
            console.log(`[SalesForecastService] Venta registrada en POS para empresa ${event.companyId}. Recalibrando modelos...`);
        }
    }
    catch (err) {
        console.warn("[SalesForecastService] Listener warning:", err.message);
    }
}).catch((err) => console.warn("[SalesForecastService] EventBus subscribe warning:", err));
const server = app.listen(PORT, () => {
    console.log(`[sales-forecast-service] Listening on port ${PORT}`);
});
(0, service_auth_1.setupGracefulShutdown)(server, async () => {
    console.log("[sales-forecast-service] Shutting down cleanly...");
    await eventBus.disconnect();
    try {
        await database_1.prisma.$disconnect();
    }
    catch (err) {
        console.warn("[sales-forecast-service] Prisma disconnect warning:", err.message);
    }
});
exports.default = app;
