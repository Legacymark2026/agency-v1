import { Request, Response, NextFunction } from "express";
export declare class ProjectController {
    /**
     * GET /api/projects
     */
    static getProjects(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * POST /api/projects
     */
    static createProject(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
}
