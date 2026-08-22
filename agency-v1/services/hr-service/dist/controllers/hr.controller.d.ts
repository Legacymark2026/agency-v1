import { Request, Response, NextFunction } from "express";
export declare class HrController {
    /**
     * GET /api/employees
     */
    static getEmployees(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * POST /api/employees
     */
    static createEmployee(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
}
