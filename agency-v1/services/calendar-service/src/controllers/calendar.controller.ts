import { Request, Response, NextFunction } from "express";
import { CalendarService } from "../services/calendar.service";

export class CalendarController {
  /**
   * GET /api/calendar/events
   */
  static async getEvents(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = String(req.headers["x-company-id"] || req.query.companyId || "");
      if (!companyId) {
        return res.status(400).json({ success: false, error: "companyId is required" });
      }

      const events = await CalendarService.getEvents(
        companyId,
        req.query.startDate ? new Date(req.query.startDate as string) : undefined,
        req.query.endDate ? new Date(req.query.endDate as string) : undefined
      );

      res.json({ success: true, events });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/calendar/events
   */
  static async createEvent(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = String(req.headers["x-company-id"] || req.body.companyId || "");
      if (!companyId) {
        return res.status(400).json({ success: false, error: "companyId is required" });
      }

      const event = await CalendarService.createEvent({
        ...req.body,
        companyId,
        startTime: new Date(req.body.startTime),
        endTime: new Date(req.body.endTime),
      });

      res.status(201).json({ success: true, event });
    } catch (err) {
      next(err);
    }
  }
}
