"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CalendarService = void 0;
const database_1 = require("@agency/database");
const events_1 = require("@agency/events");
const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";
const eventBus = new events_1.EventBus(REDIS_URL, "calendar-service");
class CalendarService {
    /**
     * Obtener eventos de calendario por empresa
     */
    static async getEvents(companyId, startDate, endDate) {
        const where = { companyId };
        if (startDate && endDate) {
            where.startTime = { gte: startDate, lte: endDate };
        }
        return database_1.prisma.calendarEvent.findMany({
            where,
            orderBy: { startTime: "asc" }
        });
    }
    /**
     * Crear evento en calendario con transacción atómica
     */
    static async createEvent(input) {
        return database_1.prisma.$transaction(async (tx) => {
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
exports.CalendarService = CalendarService;
//# sourceMappingURL=calendar.service.js.map