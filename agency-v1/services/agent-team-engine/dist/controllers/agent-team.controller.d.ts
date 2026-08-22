import { Request, Response, NextFunction } from "express";
export declare class AgentTeamController {
    /**
     * GET /api/agent/teams
     */
    static getTeams(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * POST /api/agent/teams/:teamId/run
     */
    static runTeam(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
}
