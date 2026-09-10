/**
 * Automation Service — EventBus Adapter
 * ─────────────────────────────────────────────────────────────────────────────
 */
import { IAutomationEventPublisherPort } from "../core/ports/automation.ports";

export class EventBusAutomationAdapter implements IAutomationEventPublisherPort {
  public async publishEvent(topic: string, event: Record<string, any>): Promise<void> {}
}
