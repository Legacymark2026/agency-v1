import { Request, Response, NextFunction } from "express";
import { ProjectService } from "../services/project.service";

export class ProjectController {
  /**
   * GET /api/projects
   */
  static async getProjects(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = String(req.headers["x-company-id"] || req.query.companyId || "");
      if (!companyId) {
        return res.status(400).json({ success: false, error: "companyId is required" });
      }

      const result = await ProjectService.getProjects(
        companyId,
        req.query.status as string,
        req.query.page ? parseInt(req.query.page as string, 10) : 1,
        req.query.limit ? parseInt(req.query.limit as string, 10) : 20
      );

      res.json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/projects
   */
  static async createProject(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = String(req.headers["x-company-id"] || req.body.companyId || "");
      if (!companyId) {
        return res.status(400).json({ success: false, error: "companyId is required" });
      }

      const project = await ProjectService.createProject({
        ...req.body,
        companyId
      });

      res.status(201).json({ success: true, project });
    } catch (err) {
      next(err);
    }
  }
}
