import { describe, it, expect } from "vitest";
import { CalendarUseCases } from "../src/core/usecases/calendar.usecases";
import { BookingDomain } from "../src/core/domain/calendar.domain";
import { ICalendarRepositoryPort, IMeetingProviderPort, ICalendarEventPublisherPort } from "../src/core/ports/calendar.ports";

describe("Calendar Service — Hexagonal Architecture 5.0", () => {
  it("orchestrates meeting scheduling, video room generation and cancellations with isolated ports", async () => {
    const store = new Map<string, BookingDomain>();
    const published: any[] = [];

    const mockRepo: ICalendarRepositoryPort = {
      save: async (b) => { store.set(b.id, b); return b; },
      findById: async (id) => store.get(id) || null,
      findHostBookings: async () => [],
    };

    const mockMeeting: IMeetingProviderPort = {
      generateMeetingUrl: async () => "https://meet.agency.com/call-123",
    };

    const mockPub: ICalendarEventPublisherPort = {
      publishEvent: async (topic, event) => { published.push({ topic, event }); },
    };

    const useCases = new CalendarUseCases(mockRepo, mockMeeting, mockPub);

    const booking = await useCases.createBooking({
      companyId: "c-1",
      hostUserId: "host-1",
      clientName: "Andrés Silva",
      clientEmail: "andres@cliente.com",
      startTime: new Date("2026-10-01T10:00:00Z"),
      endTime: new Date("2026-10-01T10:30:00Z"),
    });

    expect(booking.id).toBeDefined();
    expect(booking.meetingLink).toBe("https://meet.agency.com/call-123");
    expect(booking.status).toBe("CONFIRMED");
    expect(published.some(e => e.topic === "calendar.booking.created")).toBe(true);

    const cancelled = await useCases.cancelBooking(booking.id);
    expect(cancelled.status).toBe("CANCELLED");
    expect(published.some(e => e.topic === "calendar.booking.cancelled")).toBe(true);
  });
});
