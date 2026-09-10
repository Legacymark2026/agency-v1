/**
 * Calendar Service — Pure Use Cases
 */
import {
  ICalendarUseCases,
  ICalendarRepositoryPort,
  IMeetingProviderPort,
  ICalendarEventPublisherPort,
} from "../ports/calendar.ports";
import { BookingDomain } from "../domain/calendar.domain";

export class CalendarUseCases implements ICalendarUseCases {
  constructor(
    private readonly repoPort: ICalendarRepositoryPort,
    private readonly meetingPort: IMeetingProviderPort,
    private readonly eventPublisher: ICalendarEventPublisherPort
  ) {}

  public async createBooking(dto: {
    companyId: string;
    hostUserId: string;
    clientName: string;
    clientEmail: string;
    startTime: Date;
    endTime: Date;
  }): Promise<BookingDomain> {
    const meetingLink = await this.meetingPort.generateMeetingUrl(`Reunión con ${dto.clientName}`, dto.startTime);
    const booking = new BookingDomain(
      "book_" + Math.random().toString(36).substring(2, 9),
      dto.companyId,
      dto.hostUserId,
      dto.clientName,
      dto.clientEmail,
      dto.startTime,
      dto.endTime,
      "CONFIRMED",
      meetingLink
    );
    const saved = await this.repoPort.save(booking);
    await this.eventPublisher.publishEvent("calendar.booking.created", { bookingId: saved.id, clientEmail: saved.clientEmail });
    return saved;
  }

  public async cancelBooking(id: string): Promise<BookingDomain> {
    const b = await this.repoPort.findById(id);
    if (!b) throw new Error(`Reserva ${id} no encontrada`);
    const cancelled = new BookingDomain(b.id, b.companyId, b.hostUserId, b.clientName, b.clientEmail, b.startTime, b.endTime, "CANCELLED", b.meetingLink, b.createdAt);
    await this.repoPort.save(cancelled);
    await this.eventPublisher.publishEvent("calendar.booking.cancelled", { bookingId: id });
    return cancelled;
  }
}
