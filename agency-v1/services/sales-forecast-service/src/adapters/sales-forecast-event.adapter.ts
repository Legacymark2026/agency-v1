import { EventBus } from "@agency/events";
import { ISalesForecastEventPublisherPort } from "../core/ports/sales-forecast.ports";

const eventBus = new EventBus(process.env.REDIS_URL || "redis://localhost:6379", "sales-forecast-service");

export class RedisSalesForecastEventAdapter implements ISalesForecastEventPublisherPort {
  async publishForecastGenerated(payload: { companyId: string; period: string; totalRevenueProjected: number }): Promise<void> {
    try {
      await eventBus.publish("sales.forecast.generated" as any, payload);
    } catch (err: any) {
      console.warn("[SalesForecastEventAdapter] Warning:", err.message);
    }
  }

  async publishDiscountTableChanged(payload: { companyId: string; tableCode: string; action: string }): Promise<void> {
    try {
      await eventBus.publish("pricing.discount_table.updated" as any, payload);
    } catch (err: any) {
      console.warn("[SalesForecastEventAdapter] Warning:", err.message);
    }
  }

  async publishScenarioSimulated(payload: { companyId: string; scenarioName: string; isViable: boolean }): Promise<void> {
    try {
      await eventBus.publish("pricing.scenario.simulated" as any, payload);
    } catch (err: any) {
      console.warn("[SalesForecastEventAdapter] Warning:", err.message);
    }
  }

  async publishReorderSuggested(payload: { companyId: string; productId: string; sku: string; suggestedUnits: number; targetPeriod: string }): Promise<void> {
    try {
      await eventBus.publish("forecast.reorder.suggested" as any, payload);
    } catch (err: any) {
      console.warn("[SalesForecastEventAdapter] Warning:", err.message);
    }
  }
}
