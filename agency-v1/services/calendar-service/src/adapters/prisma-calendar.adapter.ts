import { ICalendarRepositoryPort } from "../core/ports/calendar.ports";
import { BookingDomain } from "../core/domain/calendar.domain";

export class PrismaCalendarAdapter implements ICalendarRepositoryPort {
  private mem = new Map<string, BookingDomain>();
  public async save(b: BookingDomain) { this.mem.set(b.id, b); return b; }
  public async findById(id: string) { return this.mem.get(id) || null; }
  public async findHostBookings(hId: string) { return Array.from(this.mem.values()).filter(b => b.hostUserId === hId); }
}
