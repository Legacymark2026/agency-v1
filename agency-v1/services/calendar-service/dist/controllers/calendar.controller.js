"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CalendarController = void 0;
const calendar_service_1 = require("../services/calendar.service");
class CalendarController {
    /**
     * GET /api/calendar/events
     */
    static async getEvents(req, res, next) {
        try {
            const companyId = String(req.headers["x-company-id"] || req.query.companyId || "");
            if (!companyId) {
                return res.status(400).json({ success: false, error: "companyId is required" });
            }
            const events = await calendar_service_1.CalendarService.getEvents(companyId, req.query.startDate ? new Date(req.query.startDate) : undefined, req.query.endDate ? new Date(req.query.endDate) : undefined);
            res.json({ success: true, events });
        }
        catch (err) {
            next(err);
        }
    }
    /**
     * POST /api/calendar/events
     */
    static async createEvent(req, res, next) {
        try {
            const companyId = String(req.headers["x-company-id"] || req.body.companyId || "");
            if (!companyId) {
                return res.status(400).json({ success: false, error: "companyId is required" });
            }
            const event = await calendar_service_1.CalendarService.createEvent({
                ...req.body,
                companyId,
                startTime: new Date(req.body.startTime),
                endTime: new Date(req.body.endTime),
            });
            res.status(201).json({ success: true, event });
        }
        catch (err) {
            next(err);
        }
    }
}
exports.CalendarController = CalendarController;
//# sourceMappingURL=calendar.controller.js.map