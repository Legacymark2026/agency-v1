import { Request, Response, NextFunction } from "express";
import { ZodSchema } from "zod";
export interface CustomError extends Error {
    statusCode?: number;
    details?: any;
}
/**
 * Middleware centralizado de gestión de errores HTTP
 */
export declare const errorHandler: (err: CustomError, req: Request, res: Response, _next: NextFunction) => void;
/**
 * Middleware genérico de validaciones con Zod para req.body, req.query o req.params
 */
export declare const validateRequest: (schema: ZodSchema, source?: "body" | "query" | "params") => (req: Request, res: Response, next: NextFunction) => void;
export { idempotencyMiddleware } from "@agency/service-auth";
