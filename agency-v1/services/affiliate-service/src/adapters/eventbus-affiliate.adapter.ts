import { IAffiliateEventPublisherPort } from "../core/ports/affiliate.ports";
export class EventBusAffiliateAdapter implements IAffiliateEventPublisherPort {
  public async publishEvent(topic: string, event: Record<string, any>) {}
}
