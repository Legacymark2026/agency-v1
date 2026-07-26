import { Request, Response, NextFunction } from "express";
import { ZodSchema, ZodError } from "zod";

export interface CustomError extends Error {
  statusCode?: number;
  details?: any;
}

export const errorHandler = (err: CustomError, req: Request, res: Response, _next: NextFunction) => {
  const correlationId = (req.headers["x-correlation-id"] || req.headers["correlation-id"] || "N/A") as string;
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  console.error(`[calendar-service][Error Trace: ${correlationId}]:`, {
    path: req.path,
    method: req.method,
    statusCode,
    error: message,
    stack: err.stack
  });

  res.status(statusCode).json({
    success: false,
    error: message,
    details: err.details || null,
    correlationId,
    timestamp: new Date().toISOString()
  });
};

export const validateRequest = (schema: ZodSchema, source: "body" | "query" | "params" = "body") => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = schema.parse(req[source]);
      req[source] = parsed;
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        res.status(400).json({
          success: false,
          error: "Invalid calendar request payload",
          details: err.errors.map(e => ({ path: e.path.join("."), message: e.message })),
          correlationId: req.headers["x-correlation-id"] || null
        });
        return;
      }
      next(err);
    }
  };
};

export { idempotencyMiddleware } from "@agency/service-auth";
