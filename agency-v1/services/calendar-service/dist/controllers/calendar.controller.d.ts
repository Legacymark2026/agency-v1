import { Request, Response, NextFunction } from "express";
export declare class CalendarController {
    /**
     * GET /api/calendar/events
     */
    static getEvents(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * POST /api/calendar/events
     */
    static createEvent(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
}
