import { IHrEventPublisherPort } from "../core/ports/hr.ports";
export class EventBusHrAdapter implements IHrEventPublisherPort {
  public async publishEvent(topic: string, event: Record<string, any>) {}
}
