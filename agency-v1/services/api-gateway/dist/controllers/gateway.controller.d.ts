import { Request, Response, NextFunction } from "express";
export declare class GatewayController {
    /**
     * POST /api/gateway/verify-token
     */
    static verifyToken(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * GET /api/gateway/services
     */
    static listServices(_req: Request, res: Response): void;
}
