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

  /**
   * POST /api/video/optimize
   */
  static async optimizeVideo(req: Request, res: Response, next: NextFunction) {
    try {
      const { videoPath } = req.body;
      if (!videoPath) {
        return res.status(400).json({ success: false, error: "videoPath is required" });
      }

      const { VideoProcessorService } = await import("../services/video-processor.service.js");
      const result = await VideoProcessorService.optimizeVideoForWeb(String(videoPath));
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/video/watermark
   */
  static async applyWatermark(req: Request, res: Response, next: NextFunction) {
    try {
      const { videoPath, logoPath, position } = req.body;
      if (!videoPath || !logoPath) {
        return res.status(400).json({ success: false, error: "videoPath and logoPath are required" });
      }

      const { VideoProcessorService } = await import("../services/video-processor.service.js");
      const result = await VideoProcessorService.applyWatermark(String(videoPath), String(logoPath), position);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }
}
