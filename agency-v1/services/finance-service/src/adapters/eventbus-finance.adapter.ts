/**
 * Finance Service — Event Bus Infrastructure Adapter (Driven Outbound Port)
 * ─────────────────────────────────────────────────────────────────────────────
 */
import { IFinanceEventPublisherPort } from "../core/ports/finance.ports";

export class EventBusFinanceAdapter implements IFinanceEventPublisherPort {
  public async publishAccountingEvent(topic: string, event: Record<string, any>): Promise<void> {
    // Publish to local event bus, Redis Pub/Sub, or message broker
  }
}
