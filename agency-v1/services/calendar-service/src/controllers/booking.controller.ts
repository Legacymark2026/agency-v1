import { Request, Response } from "express";
import { BookingService } from "../services/booking.service";

export class BookingController {
  static async getBookingTypes(req: Request, res: Response) {
    try {
      const companyId = (req.query.companyId as string) || "default-company";
      const types = await BookingService.getBookingTypes(companyId);
      return res.json({ success: true, data: types });
    } catch (err: any) {
      return res.status(400).json({ success: false, error: err.message });
    }
  }

  static async createBookingType(req: Request, res: Response) {
    try {
      const companyId = req.body.companyId || "default-company";
      const result = await BookingService.createBookingType({ ...req.body, companyId });
      return res.status(201).json({ success: true, data: result });
    } catch (err: any) {
      return res.status(400).json({ success: false, error: err.message });
    }
  }

  static async getAvailableSlots(req: Request, res: Response) {
    try {
      const companyId = (req.query.companyId as string) || "default-company";
      const bookingTypeId = req.query.bookingTypeId as string;
      const date = (req.query.date as string) || new Date().toISOString().split("T")[0];

      if (!bookingTypeId) {
        return res.status(400).json({ success: false, error: "bookingTypeId es requerido" });
      }

      const slots = await BookingService.getAvailableSlots(companyId, bookingTypeId, date);
      return res.json({ success: true, data: slots });
    } catch (err: any) {
      return res.status(400).json({ success: false, error: err.message });
    }
  }

  static async createAppointment(req: Request, res: Response) {
    try {
      const companyId = req.body.companyId || "default-company";
      const appointment = await BookingService.createAppointment({ ...req.body, companyId });
      return res.status(201).json({ success: true, data: appointment });
    } catch (err: any) {
      return res.status(400).json({ success: false, error: err.message });
    }
  }

  static async getAppointments(req: Request, res: Response) {
    try {
      const companyId = (req.query.companyId as string) || "default-company";
      const appointments = await BookingService.getAppointments(companyId);
      return res.json({ success: true, data: appointments });
    } catch (err: any) {
      return res.status(400).json({ success: false, error: err.message });
    }
  }

  static async getAvailableSlotsTz(req: Request, res: Response) {
    try {
      const companyId = (req.query.companyId as string) || "default-company";
      const bookingTypeId = req.query.bookingTypeId as string;
      const date = (req.query.date as string) || new Date().toISOString().split("T")[0];
      const timezone = (req.query.timezone as string) || "UTC";

      if (!bookingTypeId) {
        return res.status(400).json({ success: false, error: "bookingTypeId es requerido" });
      }

      const slots = await BookingService.getCrossTimezoneSlots(companyId, bookingTypeId, date, timezone);
      return res.json({ success: true, data: slots });
    } catch (err: any) {
      return res.status(400).json({ success: false, error: err.message });
    }
  }

  static async processNotes(req: Request, res: Response) {
    try {
      const appointmentId = String(req.params.appointmentId || "");
      const companyId = String(req.body.companyId || "default-company");
      const notes = String(req.body.notes || "");

      if (!notes) {
        return res.status(400).json({ success: false, error: "notes es requerido" });
      }

      const { NotesProcessorService } = await import("../services/notes-processor.service");
      const tasks = await NotesProcessorService.processMeetingNotes(appointmentId, companyId, notes);

      return res.json({ success: true, appointmentId, tasksCount: tasks.length, tasks });
    } catch (err: any) {
      return res.status(400).json({ success: false, error: err.message });
    }
  }
}
