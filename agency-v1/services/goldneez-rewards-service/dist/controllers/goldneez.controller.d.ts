import { Request, Response, NextFunction } from "express";
export declare class GoldneezController {
    /**
     * GET /api/rewards/points
     */
    static getPoints(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * POST /api/rewards/redeem
     */
    static redeemReward(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
}
