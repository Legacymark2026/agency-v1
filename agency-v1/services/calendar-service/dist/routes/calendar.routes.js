"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calendarRouter = void 0;
const express_1 = require("express");
const calendar_controller_1 = require("../controllers/calendar.controller");
const booking_controller_1 = require("../controllers/booking.controller");
const calendar_middleware_1 = require("../middlewares/calendar.middleware");
const zod_1 = require("zod");
const createEventSchema = zod_1.z.object({
    title: zod_1.z.string().min(1, "Title is required"),
    description: zod_1.z.string().optional(),
    startTime: zod_1.z.string().datetime("Invalid start time ISO format"),
    endTime: zod_1.z.string().datetime("Invalid end time ISO format"),
});
exports.calendarRouter = (0, express_1.Router)();
// Existing Calendar Events
exports.calendarRouter.get("/calendar/events", calendar_controller_1.CalendarController.getEvents);
exports.calendarRouter.post("/calendar/events", (0, calendar_middleware_1.validateRequest)(createEventSchema), calendar_controller_1.CalendarController.createEvent);
// Appointment & Booking Endpoints
exports.calendarRouter.get("/booking/types", booking_controller_1.BookingController.getBookingTypes);
exports.calendarRouter.post("/booking/types", booking_controller_1.BookingController.createBookingType);
exports.calendarRouter.get("/booking/slots", booking_controller_1.BookingController.getAvailableSlots);
exports.calendarRouter.post("/booking/appointments", booking_controller_1.BookingController.createAppointment);
exports.calendarRouter.get("/booking/appointments", booking_controller_1.BookingController.getAppointments);
//# sourceMappingURL=calendar.routes.js.map