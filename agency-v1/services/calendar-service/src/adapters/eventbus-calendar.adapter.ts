import { ICalendarEventPublisherPort } from "../core/ports/calendar.ports";
export class EventBusCalendarAdapter implements ICalendarEventPublisherPort {
  public async publishEvent(topic: string, event: Record<string, any>) {}
}
