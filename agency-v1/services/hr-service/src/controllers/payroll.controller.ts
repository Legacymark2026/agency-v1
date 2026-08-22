import { Request, Response, NextFunction } from "express";
import { PayrollService } from "../services/payroll.service.js";

export class PayrollController {
  /**
   * POST /api/v1/payroll/calculate
   */
  static async calculatePayroll(req: Request, res: Response, next: NextFunction) {
    try {
      const { employeeId, hoursWorked, ratePerHour, bonus } = req.body;
      if (!employeeId || hoursWorked === undefined || ratePerHour === undefined) {
        return res.status(400).json({ success: false, error: "employeeId, hoursWorked and ratePerHour are required" });
      }

      const result = await PayrollService.calculatePayroll({
        employeeId: String(employeeId),
        hoursWorked: Number(hoursWorked),
        ratePerHour: Number(ratePerHour),
        bonus: bonus ? Number(bonus) : undefined
      });

      res.json({ success: true, payroll: result });
    } catch (err) {
      next(err);
    }
  }
}
