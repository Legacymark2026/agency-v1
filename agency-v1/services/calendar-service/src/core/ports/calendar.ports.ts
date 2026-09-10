/**
 * Calendar Service — Hexagonal Ports
 */
import { BookingDomain } from "../domain/calendar.domain";

export interface ICalendarUseCases {
  createBooking(dto: {
    companyId: string;
    hostUserId: string;
    clientName: string;
    clientEmail: string;
    startTime: Date;
    endTime: Date;
  }): Promise<BookingDomain>;
  cancelBooking(id: string): Promise<BookingDomain>;
}

export interface ICalendarRepositoryPort {
  save(b: BookingDomain): Promise<BookingDomain>;
  findById(id: string): Promise<BookingDomain | null>;
  findHostBookings(hostUserId: string, start: Date, end: Date): Promise<BookingDomain[]>;
}

export interface IMeetingProviderPort {
  generateMeetingUrl(topic: string, start: Date): Promise<string>;
}

export interface ICalendarEventPublisherPort {
  publishEvent(topic: string, event: Record<string, any>): Promise<void>;
}
