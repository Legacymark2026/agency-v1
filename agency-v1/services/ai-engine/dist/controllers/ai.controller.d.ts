import { Request, Response, NextFunction } from "express";
export declare class AiController {
    static getAgents(req: Request, res: Response, next: NextFunction): Promise<void>;
    static runAgent(req: Request, res: Response, next: NextFunction): Promise<void>;
    /** GET /api/v1/agents/governance → list all configs for company */
    static listGovernance(req: Request, res: Response, next: NextFunction): Promise<void>;
    /** GET /api/v1/agents/:agentId/governance → get config for specific agent */
    static getGovernance(req: Request, res: Response, next: NextFunction): Promise<void>;
    /** PATCH /api/v1/agents/:agentId/governance → update governance config */
    static updateGovernance(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    /** GET /api/v1/agents/traces → paginated list of traces */
    static listTraces(req: Request, res: Response, next: NextFunction): Promise<void>;
    /** GET /api/v1/agents/traces/:traceId → single trace detail */
    static getTrace(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    /** POST /api/v1/agents/:agentId/feedback */
    static recordFeedback(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    /** GET /api/v1/agents/:agentId/feedback/stats */
    static getFeedbackStats(req: Request, res: Response, next: NextFunction): Promise<void>;
    /** GET /api/v1/agents/feedback/recent */
    static listRecentFeedback(req: Request, res: Response, next: NextFunction): Promise<void>;
    static queryRefrag(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    static getPendingHitl(req: Request, res: Response, next: NextFunction): Promise<void>;
    static processHitlDecision(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    static checkGuardrails(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
}
