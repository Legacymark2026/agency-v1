import { Router } from "express";
import { CalendarController } from "../controllers/calendar.controller";
import { BookingController } from "../controllers/booking.controller";
import { validateRequest } from "../middlewares/calendar.middleware";
import { z } from "zod";

const createEventSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  startTime: z.string().datetime("Invalid start time ISO format"),
  endTime: z.string().datetime("Invalid end time ISO format"),
});

export const calendarRouter = Router();

// Existing Calendar Events
calendarRouter.get("/calendar/events", CalendarController.getEvents);
calendarRouter.post("/calendar/events", validateRequest(createEventSchema), CalendarController.createEvent);

// Appointment & Booking Endpoints
calendarRouter.get("/booking/types", BookingController.getBookingTypes);
calendarRouter.post("/booking/types", BookingController.createBookingType);
calendarRouter.get("/booking/slots", BookingController.getAvailableSlots);
calendarRouter.post("/booking/appointments", BookingController.createAppointment);
calendarRouter.get("/booking/appointments", BookingController.getAppointments);
