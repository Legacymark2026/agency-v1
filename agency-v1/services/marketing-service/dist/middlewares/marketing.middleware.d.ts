import { Request, Response, NextFunction } from "express";
import { ZodSchema } from "zod";
export interface CustomError extends Error {
    statusCode?: number;
    details?: any;
}
export declare const errorHandler: (err: CustomError, req: Request, res: Response, _next: NextFunction) => void;
export declare const validateRequest: (schema: ZodSchema, source?: "body" | "query" | "params") => (req: Request, res: Response, next: NextFunction) => void;
export declare const idempotencyMiddleware: (req: Request, res: Response, next: NextFunction) => void;
