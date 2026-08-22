import { Request, Response, NextFunction } from "express";
export declare class AnalyticsController {
    /**
     * GET /api/analytics/activity
     */
    static getUserActivityLogs(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * POST /api/track
     */
    static trackActivity(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * POST /api/heartbeat
     */
    static heartbeat(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * POST /api/end-session
     */
    static endSession(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * GET /api/v1/analytics/metered-usage
     */
    static getMeteredUsage(req: Request, res: Response, next: NextFunction): Promise<void>;
}
