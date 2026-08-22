import { Request, Response, NextFunction } from "express";
export declare class VideoController {
    /**
     * GET /api/video/projects
     */
    static getVideoProjects(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * POST /api/video/render
     */
    static createRenderJob(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
}
