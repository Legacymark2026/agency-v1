import { Request, Response, NextFunction } from "express";
import { HrService } from "../services/hr.service";

export class HrController {
  /**
   * GET /api/employees
   */
  static async getEmployees(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = String(req.headers["x-company-id"] || req.query.companyId || "");
      if (!companyId) {
        return res.status(400).json({ success: false, error: "companyId is required" });
      }

      const result = await HrService.getEmployees(
        companyId,
        req.query.department as string,
        req.query.page ? parseInt(req.query.page as string, 10) : 1,
        req.query.limit ? parseInt(req.query.limit as string, 10) : 25
      );

      res.json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/employees
   */
  static async createEmployee(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = String(req.headers["x-company-id"] || req.body.companyId || "");
      if (!companyId) {
        return res.status(400).json({ success: false, error: "companyId is required" });
      }

      const employee = await HrService.createEmployee({
        ...req.body,
        companyId
      });

      res.status(201).json({ success: true, employee });
    } catch (err) {
      next(err);
    }
  }
}
