import { IAdminEventPublisherPort } from "../core/ports/admin.ports";
export class EventBusAdminAdapter implements IAdminEventPublisherPort {
  public async publishEvent(topic: string, event: Record<string, any>) {}
}
