import { Request, Response, NextFunction } from "express";
export declare class AdminController {
    /**
     * GET /api/admin/kanban
     */
    static getKanban(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * GET /api/admin/overview
     */
    static getOverview(_req: Request, res: Response, next: NextFunction): Promise<void>;
}
