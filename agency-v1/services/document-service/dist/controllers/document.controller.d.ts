import { Request, Response, NextFunction } from "express";
export declare class DocumentController {
    /**
     * GET /api/proposals
     */
    static getProposals(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * POST /api/proposals
     */
    static createProposal(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
}
