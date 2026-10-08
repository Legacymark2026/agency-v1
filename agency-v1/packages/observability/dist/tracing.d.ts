import { AsyncLocalStorage } from "async_hooks";
import { Request, Response, NextFunction } from "express";
export declare const traceStorage: AsyncLocalStorage<{
    traceId: string;
}>;
export declare const tracingMiddleware: (req: Request, res: Response, next: NextFunction) => void;
export declare const getTraceId: () => string | undefined;
//# sourceMappingURL=tracing.d.ts.map