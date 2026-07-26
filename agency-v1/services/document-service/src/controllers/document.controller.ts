import { Request, Response, NextFunction } from "express";
import { DocumentService } from "../services/document.service";

export class DocumentController {
  /**
   * GET /api/proposals
   */
  static async getProposals(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = String(req.headers["x-company-id"] || req.query.companyId || "");
      if (!companyId) {
        return res.status(400).json({ success: false, error: "companyId is required" });
      }

      const proposals = await DocumentService.getProposals(companyId);
      res.json({ success: true, proposals });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/proposals
   */
  static async createProposal(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = String(req.headers["x-company-id"] || req.body.companyId || "");
      if (!companyId) {
        return res.status(400).json({ success: false, error: "companyId is required" });
      }

      const proposal = await DocumentService.createProposal({
        ...req.body,
        companyId
      });

      res.status(201).json({ success: true, proposal });
    } catch (err) {
      next(err);
    }
  }
}
