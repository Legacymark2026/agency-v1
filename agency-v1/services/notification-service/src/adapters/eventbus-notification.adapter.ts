/**
 * Notification Service — Event Bus Adapter
 * ─────────────────────────────────────────────────────────────────────────────
 */
import { INotificationEventPublisherPort } from "../core/ports/notification.ports";

export class EventBusNotificationAdapter implements INotificationEventPublisherPort {
  public async publishEvent(topic: string, event: Record<string, any>): Promise<void> {
    // Dispatches to EventBus
  }
}
