/**
 * Redis EventBus Adapter for Inventory Service
 */
import { EventBus } from "@agency/events";
import { IInventoryEventPublisherPort } from "../core/ports/inventory.ports";
import { MovementType } from "../core/domain/inventory.domain";

const eventBus = new EventBus(process.env.REDIS_URL || "redis://localhost:6379", "inventory-service");

export class RedisInventoryEventAdapter implements IInventoryEventPublisherPort {
  async publishStockLow(payload: {
    companyId: string;
    warehouseId: string;
    productId: string;
    sku: string;
    currentQuantity: number;
    reorderPoint: number;
  }): Promise<void> {
    try {
      await eventBus.publish("inventory.stock.low" as any, payload);
    } catch (err: any) {
      console.warn("[InventoryEventAdapter] Could not publish inventory.stock.low:", err.message);
    }
  }

  async publishMovementRecorded(payload: {
    movementId: string;
    companyId: string;
    movementType: MovementType;
    quantity: number;
  }): Promise<void> {
    try {
      await eventBus.publish("inventory.movement.recorded" as any, payload);
    } catch (err: any) {
      console.warn("[InventoryEventAdapter] Could not publish inventory.movement.recorded:", err.message);
    }
  }
}
