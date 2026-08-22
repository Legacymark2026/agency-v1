import { Request, Response, NextFunction } from "express";
export declare class NotificationController {
    /**
     * GET /api/notifications
     */
    static getUserNotifications(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * POST /api/notifications/dispatch
     */
    static dispatchNotification(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
}
//# sourceMappingURL=notification.controller.d.ts.map