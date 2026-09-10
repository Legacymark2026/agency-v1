/**
 * Inbox Service — EventBus Adapter
 * ─────────────────────────────────────────────────────────────────────────────
 */
import { IInboxEventPublisherPort } from "../core/ports/inbox.ports";

export class EventBusInboxAdapter implements IInboxEventPublisherPort {
  public async publishInboxEvent(topic: string, event: Record<string, any>): Promise<void> {
    // Dispatches to EventBus
  }
}
