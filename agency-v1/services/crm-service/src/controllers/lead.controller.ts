import { Request, Response, NextFunction } from "express";
import { LeadService } from "../services/lead.service";

export class LeadController {
  /**
   * GET /api/leads
   */
  static async getLeads(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = (req.headers["x-company-id"] as string) || (req.query.companyId as string);
      if (!companyId) {
        return res.status(400).json({ success: false, error: "companyId is required" });
      }

      const result = await LeadService.getLeads({
        companyId,
        status: req.query.status as string,
        source: req.query.source as string,
        scoreMin: req.query.scoreMin ? parseInt(req.query.scoreMin as string, 10) : undefined,
        scoreMax: req.query.scoreMax ? parseInt(req.query.scoreMax as string, 10) : undefined,
        search: req.query.search as string,
        page: req.query.page ? parseInt(req.query.page as string, 10) : 1,
        pageSize: req.query.pageSize ? parseInt(req.query.pageSize as string, 10) : 20,
        sortBy: (req.query.sortBy as string) || "createdAt",
        sortOrder: (req.query.sortOrder as "asc" | "desc") || "desc",
        syncDealId: req.query.syncDealId as string,
        syncEmail: req.query.syncEmail as string,
      });

      res.json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/leads/:id
   */
  static async getLeadById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const companyId = (req.headers["x-company-id"] as string) || (req.query.companyId as string);
      if (!companyId) {
        return res.status(400).json({ success: false, error: "companyId is required" });
      }

      const lead = await LeadService.getLeadById(id, companyId);
      res.json({ success: true, lead });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/leads
   */
  static async createLead(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = (req.headers["x-company-id"] as string) || req.body.companyId;
      if (!companyId) {
        return res.status(400).json({ success: false, error: "companyId is required" });
      }

      const lead = await LeadService.createLead({
        ...req.body,
        companyId
      });

      res.status(201).json({ success: true, lead });
    } catch (err) {
      next(err);
    }
  }
}
