import { Request, Response, NextFunction } from "express";
interface RateLimiterOptions {
    windowSeconds?: number;
    maxRequests?: number;
    keyPrefix?: string;
}
export declare function resilientRateLimiter(options?: RateLimiterOptions): (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
export {};
//# sourceMappingURL=rate-limiter.d.ts.map