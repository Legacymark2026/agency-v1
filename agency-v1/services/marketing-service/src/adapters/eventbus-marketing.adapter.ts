import { IMarketingEventPublisherPort } from "../core/ports/marketing.ports";
export class EventBusMarketingAdapter implements IMarketingEventPublisherPort {
  public async publishEvent(topic: string, event: Record<string, any>) {}
}
