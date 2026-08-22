import { Request, Response, NextFunction } from "express";
export declare class PayrollController {
    /**
     * POST /api/v1/payroll/calculate
     */
    static calculatePayroll(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
}
