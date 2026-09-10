/**
 * Document Service — EventBus Adapter
 * ─────────────────────────────────────────────────────────────────────────────
 */
import { IDocumentEventPublisherPort } from "../core/ports/document.ports";

export class EventBusDocumentAdapter implements IDocumentEventPublisherPort {
  public async publishEvent(topic: string, event: Record<string, any>): Promise<void> {}
}
