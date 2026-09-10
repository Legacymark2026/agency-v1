/**
 * Auth Service — EventBus Adapter
 * ─────────────────────────────────────────────────────────────────────────────
 */
import { IAuthEventPublisherPort } from "../core/ports/auth.ports";

export class EventBusAuthAdapter implements IAuthEventPublisherPort {
  public async publishEvent(topic: string, event: Record<string, any>): Promise<void> {}
}
