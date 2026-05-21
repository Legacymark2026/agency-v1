import { RateLimiterRedis } from 'rate-limiter-flexible';
import { Request, Response, NextFunction } from 'express';
export declare function getRateLimiter(): RateLimiterRedis;
export declare function rateLimitMiddleware(req: Request, res: Response, next: NextFunction): void;
export declare function getRateLimitStatus(companyId: string): Promise<{
    limit: number;
    remaining: number;
    reset: Date;
    blocked: boolean;
}>;
