import { AsyncLocalStorage } from "async_hooks";
import { randomUUID } from "crypto";
import { Request, Response, NextFunction } from "express";

export const traceStorage = new AsyncLocalStorage<{ traceId: string }>();

export const tracingMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const traceId = (req.headers["x-trace-id"] as string) || randomUUID();
  res.setHeader("x-trace-id", traceId);
  traceStorage.run({ traceId }, () => {
    next();
  });
};

export const getTraceId = () => {
  return traceStorage.getStore()?.traceId;
};
