"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BookingService = void 0;
const database_1 = require("@agency/database");
const events_1 = require("@agency/events");
const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";
let eventBus = null;
try {
    eventBus = new events_1.EventBus(REDIS_URL, "calendar-service");
}
catch {
    console.warn("Redis EventBus not available for calendar-service");
}
class BookingService {
    /**
     * List booking types for a company
     */
    static async getBookingTypes(companyId) {
        return database_1.prisma.bookingType.findMany({
            where: { companyId, isActive: true },
            orderBy: { createdAt: "asc" },
        });
    }
    /**
     * Create or update a booking type
     */
    static async createBookingType(input) {
        return database_1.prisma.bookingType.upsert({
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
                assignmentStrategy: input.assignmentStrategy || "ROUND_ROBIN",
                requiresPayment: input.requiresPayment || false,
            },
            update: {
                name: input.name,
                description: input.description,
                durationMinutes: input.durationMinutes,
                bufferMinutes: input.bufferMinutes,
                price: input.price,
                locationType: input.locationType,
                color: input.color,
                assignmentStrategy: input.assignmentStrategy,
                requiresPayment: input.requiresPayment,
            },
        });
    }
    /**
     * Calculate available time slots for a given date (YYYY-MM-DD)
     */
    static async getAvailableSlots(companyId, bookingTypeId, dateStr) {
        const bookingType = await database_1.prisma.bookingType.findFirst({
            where: { id: bookingTypeId, companyId },
        });
        if (!bookingType) {
            throw new Error("Booking type not found");
        }
        const targetDate = new Date(dateStr);
        const dayOfWeek = targetDate.getUTCDay(); // 0=Sun, 1=Mon, ..., 6=Sat
        // Fetch availability rules for this day
        const rules = await database_1.prisma.availabilityRule.findMany({
            where: { companyId, dayOfWeek, isActive: true },
        });
        let startHour = 9;
        let endHour = 17;
        if (dayOfWeek === 0 || dayOfWeek === 6) {
            if (rules.length === 0)
                return [];
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
        const existingAppointments = await database_1.prisma.appointment.findMany({
            where: {
                companyId,
                bookingTypeId,
                status: { in: ["CONFIRMED", "PENDING"] },
                startTime: { gte: dayStart, lte: dayEnd },
            },
        });
        const slots = [];
        let current = new Date(dayStart);
        while (current.getTime() + bookingType.durationMinutes * 60 * 1000 <= dayEnd.getTime()) {
            const slotEnd = new Date(current.getTime() + bookingType.durationMinutes * 60 * 1000);
            const isOverlap = existingAppointments.some((appt) => {
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
     * Book an appointment with CRM Lead Auto-Sync & Notifications
     */
    static async createAppointment(input) {
        const bookingType = await database_1.prisma.bookingType.findUnique({
            where: { id: input.bookingTypeId },
        });
        if (!bookingType) {
            throw new Error("Tipo de cita no encontrado");
        }
        const startTime = new Date(input.startTime);
        const endTime = new Date(startTime.getTime() + bookingType.durationMinutes * 60 * 1000);
        // Check overlap
        const overlap = await database_1.prisma.appointment.findFirst({
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
        // CRM Lead Auto-Sync
        let leadId = null;
        try {
            const existingLead = await database_1.prisma.lead.findFirst({
                where: { companyId: input.companyId, email: input.customerEmail },
            });
            if (existingLead) {
                leadId = existingLead.id;
                await database_1.prisma.lead.update({
                    where: { id: existingLead.id },
                    data: {
                        status: "MEETING_SCHEDULED",
                        notes: `[Agendamiento] Cita para el ${startTime.toISOString()}. Notas: ${input.notes || "Sin notas"}`,
                    },
                });
            }
            else {
                const newLead = await database_1.prisma.lead.create({
                    data: {
                        companyId: input.companyId,
                        email: input.customerEmail,
                        name: input.customerName,
                        status: "MEETING_SCHEDULED",
                        source: "BOOKING_PAGE",
                        notes: `Cita agendada para el ${startTime.toISOString()}`,
                    },
                });
                leadId = newLead.id;
            }
        }
        catch (err) {
            console.warn("Could not sync lead in booking.service", err);
        }
        const meetId = Math.random().toString(36).substring(2, 7) + "-" + Math.random().toString(36).substring(2, 6);
        const meetingUrl = `https://meet.google.com/${meetId}`;
        const appointment = await database_1.prisma.appointment.create({
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
                leadId,
                paymentStatus: bookingType.requiresPayment ? "PENDING_PAYMENT" : "FREE",
            },
            include: {
                bookingType: true,
            },
        });
        // Publish event for WhatsApp / Email notifications
        if (eventBus) {
            try {
                await eventBus.publish("appointment.created", {
                    appointmentId: appointment.id,
                    companyId: appointment.companyId,
                    customerName: appointment.customerName,
                    customerEmail: appointment.customerEmail,
                    customerPhone: appointment.customerPhone,
                    startTime: appointment.startTime,
                    meetingUrl: appointment.meetingUrl,
                    leadId: appointment.leadId,
                });
            }
            catch (err) {
                console.warn("Failed to publish appointment.created event", err);
            }
        }
        return appointment;
    }
    /**
     * List all appointments for a company
     */
    static async getAppointments(companyId) {
        return database_1.prisma.appointment.findMany({
            where: { companyId },
            include: { bookingType: true },
            orderBy: { startTime: "asc" },
        });
    }
}
exports.BookingService = BookingService;
//# sourceMappingURL=booking.service.js.map