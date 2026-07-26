import { Request, Response, NextFunction } from "express";
import { AdminService } from "../services/admin.service";

export class AdminController {
  /**
   * GET /api/admin/kanban
   */
  static async getKanban(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = String(req.headers["x-company-id"] || req.query.companyId || "");
      if (!companyId) {
        return res.status(400).json({ success: false, error: "companyId is required" });
      }

      const projects = await AdminService.getAdminKanbanProjects(companyId);
      res.json({ success: true, projects });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/admin/overview
   */
  static async getOverview(_req: Request, res: Response, next: NextFunction) {
    try {
      const overview = await AdminService.getSystemOverview();
      res.json({ success: true, overview });
    } catch (err) {
      next(err);
    }
  }
}
