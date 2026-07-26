import { prisma } from "@agency/database";
import { EventBus } from "@agency/events";

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";
const eventBus = new EventBus(REDIS_URL, "calendar-service");

export interface CreateEventInput {
  companyId: string;
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  attendees?: string[];
}

export class CalendarService {
  /**
   * Obtener eventos de calendario por empresa
   */
  static async getEvents(companyId: string, startDate?: Date, endDate?: Date) {
    const where: Record<string, unknown> = { companyId };
    if (startDate && endDate) {
      where.startTime = { gte: startDate, lte: endDate };
    }

    return prisma.calendarEvent.findMany({
      where,
      orderBy: { startTime: "asc" }
    });
  }

  /**
   * Crear evento en calendario con transacción atómica
   */
  static async createEvent(input: CreateEventInput) {
    return prisma.$transaction(async (tx: any) => {
      const event = await tx.calendarEvent.create({
        data: {
          companyId: input.companyId,
          title: input.title,
          description: input.description,
          startTime: input.startTime,
          endTime: input.endTime,
          attendees: input.attendees || [],
          status: "SCHEDULED"
        }
      });

      return event;
    });
  }
}
