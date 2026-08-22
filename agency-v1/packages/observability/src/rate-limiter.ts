import { Request, Response, NextFunction } from "express";

let cache: any = null;
const memoryStore = new Map<string, string>();

function getCache() {
  if (!cache) {
    try {
      const { ResilientCacheClient } = require("@agency/events");
      cache = new ResilientCacheClient(process.env.REDIS_URL);
    } catch {
      cache = {
        get: async (k: string) => memoryStore.get(k) || null,
        set: async (k: string, v: string) => memoryStore.set(k, v),
      };
    }
  }
  return cache;
}

interface RateLimiterOptions {
  windowSeconds?: number;
  maxRequests?: number;
  keyPrefix?: string;
}

export function resilientRateLimiter(options: RateLimiterOptions = {}) {
  const windowSeconds = options.windowSeconds || 60;
  const maxRequests = options.maxRequests || 120;
  const keyPrefix = options.keyPrefix || "rate_limit";

  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const clientIdentifier =
        (req.headers["x-tenant-id"] as string) ||
        (req as any).authUser?.companyId ||
        req.ip ||
        "anonymous";

      const key = `${keyPrefix}:${clientIdentifier}:${Math.floor(Date.now() / (windowSeconds * 1000))}`;
      const rawCount = await getCache().get(key);
      const currentCount = rawCount ? parseInt(rawCount, 10) : 0;

      if (currentCount >= maxRequests) {
        res.setHeader("Retry-After", windowSeconds);
        res.setHeader("X-RateLimit-Limit", maxRequests);
        res.setHeader("X-RateLimit-Remaining", 0);
        return res.status(429).json({
          error: "Too Many Requests",
          message: `Has superado el límite de ${maxRequests} peticiones por minuto. Por favor reintenta en unos momentos.`,
          retryAfterSeconds: windowSeconds,
        });
      }

      await getCache().set(key, String(currentCount + 1), windowSeconds);

      res.setHeader("X-RateLimit-Limit", maxRequests);
      res.setHeader("X-RateLimit-Remaining", Math.max(0, maxRequests - (currentCount + 1)));

      next();
    } catch (err) {
      // Fail-open strategy: rate-limiting errors never block legitimate traffic
      console.warn("[RateLimiter] Non-fatal error during rate limit evaluation:", err);
      next();
    }
  };
}
