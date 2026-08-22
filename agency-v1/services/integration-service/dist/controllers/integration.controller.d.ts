import { Request, Response, NextFunction } from "express";
export declare class IntegrationController {
    /**
     * GET /api/integrations
     */
    static getIntegrations(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * POST /api/integrations
     */
    static connectIntegration(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
}
