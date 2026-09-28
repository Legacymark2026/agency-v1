import { IAnalyticsEventPublisherPort } from "../core/ports/analytics.ports";
export declare class EventBusAnalyticsAdapter implements IAnalyticsEventPublisherPort {
    publishEvent(topic: string, event: Record<string, any>): Promise<void>;
}
