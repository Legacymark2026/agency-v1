import { IIntegrationEventPublisherPort } from "../core/ports/integration.ports";
export class EventBusIntegrationAdapter implements IIntegrationEventPublisherPort {
  public async publishEvent(topic: string, event: Record<string, any>) {}
}
