/**
 * AI Engine — EventBus Adapter
 * ─────────────────────────────────────────────────────────────────────────────
 */
import { IAiEventPublisherPort } from "../core/ports/ai.ports";

export class EventBusAiAdapter implements IAiEventPublisherPort {
  public async publishAiEvent(topic: string, event: Record<string, any>): Promise<void> {}
}
