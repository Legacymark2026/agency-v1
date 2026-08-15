import { prisma } from "@agency/database";
import { EventBus } from "@agency/events";

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";
let eventBus: EventBus | null = null;
try {
  eventBus = new EventBus(REDIS_URL, "calendar-service");
} catch {
  console.warn("Redis EventBus not available for calendar-service");
}

export interface CreateBookingTypeInput {
  companyId: string;
  name: string;
  slug: string;
  description?: string;
  durationMinutes?: number;
  bufferMinutes?: number;
  price?: number;
  currency?: string;
  locationType?: string;
  color?: string;
}

export interface CreateAppointmentInput {
  companyId: string;
  bookingTypeId: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  startTime: Date;
  notes?: string;
}

export class BookingService {
  /**
   * List booking types for a company
   */
  static async getBookingTypes(companyId: string) {
    return (prisma as any).bookingType.findMany({
      where: { companyId, isActive: true },
      orderBy: { createdAt: "asc" },
    });
  }

  /**
   * Create or update a booking type
   */
  static async createBookingType(input: CreateBookingTypeInput) {
    return (prisma as any).bookingType.upsert({
      where: {
        companyId_slug: { companyId: input.companyId, slug: input.slug },
      },
      create: {
        companyId: input.companyId,
        name: input.name,
        slug: input.slug,
        description: input.description,
        durationMinutes: input.durationMinutes || 30,
        bufferMinutes: input.bufferMinutes || 10,
        price: input.price || 0,
        currency: input.currency || "USD",
        locationType: input.locationType || "google_meet",
        color: input.color || "#0d9488",
      },
      update: {
        name: input.name,
        description: input.description,
        durationMinutes: input.durationMinutes,
        bufferMinutes: input.bufferMinutes,
        price: input.price,
        locationType: input.locationType,
        color: input.color,
      },
    });
  }

  /**
   * Calculate available time slots for a given date (YYYY-MM-DD)
   */
  static async getAvailableSlots(companyId: string, bookingTypeId: string, dateStr: string) {
    const bookingType = await (prisma as any).bookingType.findFirst({
      where: { id: bookingTypeId, companyId },
    });

    if (!bookingType) {
      throw new Error("Booking type not found");
    }

    const targetDate = new Date(dateStr);
    const dayOfWeek = targetDate.getUTCDay(); // 0=Sun, 1=Mon, ..., 6=Sat

    // Fetch availability rules for this day
    const rules = await (prisma as any).availabilityRule.findMany({
      where: { companyId, dayOfWeek, isActive: true },
    });

    // Default working hours if no custom rule exists (Mon-Fri 09:00 - 17:00)
    let startHour = 9;
    let endHour = 17;

    if (dayOfWeek === 0 || dayOfWeek === 6) {
      // Weekend closed by default unless rules specify
      if (rules.length === 0) return [];
    }

    if (rules.length > 0) {
      const partsStart = rules[0].startTime.split(":");
      const partsEnd = rules[0].endTime.split(":");
      startHour = parseInt(partsStart[0], 10);
      endHour = parseInt(partsEnd[0], 10);
    }

    const durationMs = (bookingType.durationMinutes + bookingType.bufferMinutes) * 60 * 1000;
    const dayStart = new Date(targetDate);
    dayStart.setUTCHours(startHour, 0, 0, 0);

    const dayEnd = new Date(targetDate);
    dayEnd.setUTCHours(endHour, 0, 0, 0);

    // Fetch existing appointments on targetDate
    const existingAppointments = await (prisma as any).appointment.findMany({
      where: {
        companyId,
        bookingTypeId,
        status: { in: ["CONFIRMED", "PENDING"] },
        startTime: { gte: dayStart, lte: dayEnd },
      },
    });

    const slots: { startTime: string; endTime: string; available: boolean }[] = [];
    let current = new Date(dayStart);

    while (current.getTime() + bookingType.durationMinutes * 60 * 1000 <= dayEnd.getTime()) {
      const slotEnd = new Date(current.getTime() + bookingType.durationMinutes * 60 * 1000);
      
      const isOverlap = existingAppointments.some((appt: any) => {
        const aStart = new Date(appt.startTime).getTime();
        const aEnd = new Date(appt.endTime).getTime();
        return current.getTime() < aEnd && slotEnd.getTime() > aStart;
      });

      if (!isOverlap) {
        slots.push({
          startTime: current.toISOString(),
          endTime: slotEnd.toISOString(),
          available: true,
        });
      }

      current = new Date(current.getTime() + durationMs);
    }

    return slots;
  }

  /**
   * Book an appointment with validation
   */
  static async createAppointment(input: CreateAppointmentInput) {
    const bookingType = await (prisma as any).bookingType.findUnique({
      where: { id: input.bookingTypeId },
    });

    if (!bookingType) {
      throw new Error("Tipo de cita no encontrado");
    }

    const startTime = new Date(input.startTime);
    const endTime = new Date(startTime.getTime() + bookingType.durationMinutes * 60 * 1000);

    // Check overlap
    const overlap = await (prisma as any).appointment.findFirst({
      where: {
        companyId: input.companyId,
        bookingTypeId: input.bookingTypeId,
        status: "CONFIRMED",
        startTime: { lt: endTime },
        endTime: { gt: startTime },
      },
    });

    if (overlap) {
      throw new Error("El horario seleccionado ya no está disponible.");
    }

    const meetId = Math.random().toString(36).substring(2, 7) + "-" + Math.random().toString(36).substring(2, 6);
    const meetingUrl = `https://meet.google.com/${meetId}`;

    const appointment = await (prisma as any).appointment.create({
      data: {
        companyId: input.companyId,
        bookingTypeId: input.bookingTypeId,
        customerName: input.customerName,
        customerEmail: input.customerEmail,
        customerPhone: input.customerPhone,
        startTime,
        endTime,
        meetingUrl,
        notes: input.notes,
        status: "CONFIRMED",
      },
      include: {
        bookingType: true,
      },
    });

    // Publish event for notifications (Email/WhatsApp)
    if (eventBus) {
      try {
        await eventBus.publish("appointment.created", {
          appointmentId: appointment.id,
          companyId: appointment.companyId,
          customerName: appointment.customerName,
          customerEmail: appointment.customerEmail,
          startTime: appointment.startTime,
          meetingUrl: appointment.meetingUrl,
        });
      } catch (err) {
        console.warn("Failed to publish appointment.created event", err);
      }
    }

    return appointment;
  }

  /**
   * List all appointments for a company
   */
  static async getAppointments(companyId: string) {
    return (prisma as any).appointment.findMany({
      where: { companyId },
      include: { bookingType: true },
      orderBy: { startTime: "asc" },
    });
  }
}
