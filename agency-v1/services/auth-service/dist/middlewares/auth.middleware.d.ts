import { Request, Response, NextFunction } from "express";
import { ZodSchema } from "zod";
export interface CustomError extends Error {
    statusCode?: number;
    details?: any;
}
/**
 * Middleware centralizado de errores para auth-service
 */
export declare const errorHandler: (err: CustomError, req: Request, res: Response, _next: NextFunction) => void;
/**
 * Middleware de validación con Zod para req.body / req.query
 */
export declare const validateRequest: (schema: ZodSchema, source?: "body" | "query" | "params") => (req: Request, res: Response, next: NextFunction) => void;
export { idempotencyMiddleware } from "@agency/service-auth";
