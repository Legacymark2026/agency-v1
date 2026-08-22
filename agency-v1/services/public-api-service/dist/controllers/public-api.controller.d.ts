import { Request, Response, NextFunction } from "express";
export declare class PublicApiController {
    /**
     * GET /api/v1/status
     */
    static getStatus(_req: Request, res: Response, next: NextFunction): Promise<void>;
}
