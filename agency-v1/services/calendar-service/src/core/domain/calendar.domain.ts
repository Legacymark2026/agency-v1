/**
 * Calendar Service — Pure Domain Entities
 */
export class BookingDomain {
  constructor(
    public readonly id: string,
    public readonly companyId: string,
    public readonly hostUserId: string,
    public readonly clientName: string,
    public readonly clientEmail: string,
    public readonly startTime: Date,
    public readonly endTime: Date,
    public readonly status: "CONFIRMED" | "CANCELLED" | "RESCHEDULED" = "CONFIRMED",
    public readonly meetingLink?: string,
    public readonly createdAt: Date = new Date()
  ) {}
}
