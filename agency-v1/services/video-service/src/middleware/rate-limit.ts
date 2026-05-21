import { RateLimiterRedis } from 'rate-limiter-flexible';
import { Redis } from 'ioredis';
import { Request, Response, NextFunction } from 'express';

let rateLimiter: RateLimiterRedis | null = null;

export function getRateLimiter(): RateLimiterRedis {
  if (!rateLimiter) {
    rateLimiter = new RateLimiterRedis({
      storeClient: new Redis(process.env.REDIS_URL || 'redis://localhost:6379'),
      keyPrefix: 'video_rate_limit',
      points: parseInt(process.env.RENDER_RATE_LIMIT || '10'),
      duration: parseInt(process.env.RENDER_RATE_WINDOW || '3600'),
      blockDuration: parseInt(process.env.RENDER_RATE_BLOCK || '300'),
    });
  }
  return rateLimiter;
}

export function rateLimitMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const companyId = req.body.companyId || req.query.companyId || 'anonymous';
  const limiter = getRateLimiter();

  limiter.consume(companyId)
    .then(() => {
      next();
    })
    .catch((rejRes) => {
      const retrySecs = Math.ceil(rejRes.msBeforeNext / 1000);
      res.set('Retry-After', String(retrySecs));
      res.set('X-RateLimit-Limit', String(process.env.RENDER_RATE_LIMIT || '10'));
      res.set('X-RateLimit-Remaining', String(rejRes.remainingPoints));
      res.set('X-RateLimit-Reset', String(new Date(Date.now() + rejRes.msBeforeNext).toISOString()));
      res.status(429).json({
        error: 'Too many render requests',
        retryAfter: retrySecs,
        remaining: rejRes.remainingPoints,
      });
    });
}

export async function getRateLimitStatus(companyId: string): Promise<{
  limit: number;
  remaining: number;
  reset: Date;
  blocked: boolean;
}> {
  const limiter = getRateLimiter();

  try {
    const status = await limiter.get(companyId);
    return {
      limit: parseInt(process.env.RENDER_RATE_LIMIT || '10'),
      remaining: status ? status.remainingPoints : parseInt(process.env.RENDER_RATE_LIMIT || '10'),
      reset: status ? new Date(Date.now() + status.msBeforeNext) : new Date(),
      blocked: false,
    };
  } catch {
    return {
      limit: parseInt(process.env.RENDER_RATE_LIMIT || '10'),
      remaining: 0,
      reset: new Date(Date.now() + 300000),
      blocked: true,
    };
  }
}
