import { Request, Response, NextFunction } from "express";

export interface CustomError extends Error {
  statusCode?: number;
  details?: any;
}

export const errorHandler = (err: CustomError, req: Request, res: Response, _next: NextFunction) => {
  const correlationId = (req.headers["x-correlation-id"] || req.headers["correlation-id"] || "N/A") as string;
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  console.error(`[public-api-service][Error Trace: ${correlationId}]:`, {
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
