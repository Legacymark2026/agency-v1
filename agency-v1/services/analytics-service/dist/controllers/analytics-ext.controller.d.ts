import { Request, Response, NextFunction } from "express";
export declare class AnalyticsExtController {
    /**
     * GET /api/v1/analytics/predict-sales
     */
    static predictSales(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * GET /api/v1/analytics/report/pdf
     */
    static getPdfReport(req: Request, res: Response, next: NextFunction): Promise<void>;
}
