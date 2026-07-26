import { Request, Response, NextFunction } from "express";
import { VideoService } from "../services/video.service";

export class VideoController {
  /**
   * GET /api/video/projects
   */
  static async getVideoProjects(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = String(req.headers["x-company-id"] || req.query.companyId || "");
      if (!companyId) {
        return res.status(400).json({ success: false, error: "companyId is required" });
      }

      const projects = await VideoService.getVideoProjects(companyId);
      res.json({ success: true, projects });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/video/render
   */
  static async createRenderJob(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = String(req.headers["x-company-id"] || req.body.companyId || "");
      if (!companyId) {
        return res.status(400).json({ success: false, error: "companyId is required" });
      }

      const job = await VideoService.createRenderJob({
        ...req.body,
        companyId
      });

      res.status(201).json({ success: true, job });
    } catch (err) {
      next(err);
    }
  }
}
