import { IAnalyticsEventPublisherPort } from "../core/ports/analytics.ports";
export class EventBusAnalyticsAdapter implements IAnalyticsEventPublisherPort {
  public async publishEvent(topic: string, event: Record<string, any>) {}
}
