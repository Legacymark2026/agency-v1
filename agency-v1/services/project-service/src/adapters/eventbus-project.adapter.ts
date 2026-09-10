/**
 * Project Service — EventBus Adapter
 * ─────────────────────────────────────────────────────────────────────────────
 */
import { IProjectEventPublisherPort } from "../core/ports/project.ports";

export class EventBusProjectAdapter implements IProjectEventPublisherPort {
  public async publishEvent(topic: string, event: Record<string, any>): Promise<void> {}
}
