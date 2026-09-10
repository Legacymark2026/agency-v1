import { IMeetingProviderPort } from "../core/ports/calendar.ports";
export class MeetingProviderAdapter implements IMeetingProviderPort {
  public async generateMeetingUrl(topic: string, start: Date): Promise<string> {
    return `https://meet.agency.com/${Math.random().toString(36).substring(2, 8)}`;
  }
}
