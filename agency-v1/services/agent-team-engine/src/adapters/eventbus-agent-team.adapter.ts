/**
 * Agent Team Engine — EventBus Adapter
 * ─────────────────────────────────────────────────────────────────────────────
 */
import { IAgentTeamEventPublisherPort } from "../core/ports/agent-team.ports";

export class EventBusAgentTeamAdapter implements IAgentTeamEventPublisherPort {
  public async publishEvent(topic: string, event: Record<string, any>): Promise<void> {}
}
