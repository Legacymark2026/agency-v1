/**
 * CRM Service — Event Bus Infrastructure Adapter (Driven Outbound Port)
 * ─────────────────────────────────────────────────────────────────────────────
 */
import { ICrmEventPublisherPort } from "../core/ports/crm.ports";

export class EventBusCrmAdapter implements ICrmEventPublisherPort {
  public async publishCrmEvent(topic: string, event: Record<string, any>): Promise<void> {
    // Dispatches to event broker or Redis
  }
}
