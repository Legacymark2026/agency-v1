import { Request, Response, NextFunction } from "express";
export interface CustomError extends Error {
    statusCode?: number;
    details?: any;
}
export declare const errorHandler: (err: CustomError, req: Request, res: Response, _next: NextFunction) => void;
export { idempotencyMiddleware } from "@agency/service-auth";
