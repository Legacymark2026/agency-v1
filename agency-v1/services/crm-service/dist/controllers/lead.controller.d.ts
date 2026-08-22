import { Request, Response, NextFunction } from "express";
export declare class LeadController {
    /**
     * GET /api/leads
     */
    static getLeads(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * GET /api/leads/:id
     */
    static getLeadById(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * POST /api/leads
     */
    static createLead(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
}
