import { Request, Response, NextFunction } from "express";
export declare class PreferencesController {
    /**
     * POST /api/v1/leads/unsubscribe
     */
    static unsubscribe(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
}
