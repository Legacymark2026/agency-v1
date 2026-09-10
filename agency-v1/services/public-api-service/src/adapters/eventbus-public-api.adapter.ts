import { IPublicApiEventPublisherPort } from "../core/ports/public-api.ports";
export class EventBusPublicApiAdapter implements IPublicApiEventPublisherPort {
  public async publishEvent(topic: string, event: Record<string, any>) {}
}
