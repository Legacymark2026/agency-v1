"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisSalesForecastEventAdapter = void 0;
const events_1 = require("@agency/events");
const eventBus = new events_1.EventBus(process.env.REDIS_URL || "redis://localhost:6379", "sales-forecast-service");
class RedisSalesForecastEventAdapter {
    async publishForecastGenerated(payload) {
        try {
            await eventBus.publish("sales.forecast.generated", payload);
        }
        catch (err) {
            console.warn("[SalesForecastEventAdapter] Warning:", err.message);
        }
    }
    async publishDiscountTableChanged(payload) {
        try {
            await eventBus.publish("pricing.discount_table.updated", payload);
        }
        catch (err) {
            console.warn("[SalesForecastEventAdapter] Warning:", err.message);
        }
    }
    async publishScenarioSimulated(payload) {
        try {
            await eventBus.publish("pricing.scenario.simulated", payload);
        }
        catch (err) {
            console.warn("[SalesForecastEventAdapter] Warning:", err.message);
        }
    }
    async publishReorderSuggested(payload) {
        try {
            await eventBus.publish("forecast.reorder.suggested", payload);
        }
        catch (err) {
            console.warn("[SalesForecastEventAdapter] Warning:", err.message);
        }
    }
}
exports.RedisSalesForecastEventAdapter = RedisSalesForecastEventAdapter;
