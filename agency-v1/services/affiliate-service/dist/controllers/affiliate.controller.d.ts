import { Request, Response, NextFunction } from "express";
export declare class AffiliateController {
    /**
     * GET /api/affiliates/profile
     */
    static getProfile(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * GET /r/:code
     */
    static trackClick(req: Request, res: Response, next: NextFunction): Promise<void>;
}
