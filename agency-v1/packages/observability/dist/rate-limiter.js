"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resilientRateLimiter = resilientRateLimiter;
let cache = null;
const memoryStore = new Map();
function getCache() {
    if (!cache) {
        try {
            const { ResilientCacheClient } = require("@agency/events");
            cache = new ResilientCacheClient(process.env.REDIS_URL);
        }
        catch {
            cache = {
                get: async (k) => memoryStore.get(k) || null,
                set: async (k, v) => memoryStore.set(k, v),
                incr: async (k) => {
                    const val = (parseInt(memoryStore.get(k) || '0', 10) || 0) + 1;
                    memoryStore.set(k, String(val));
                    return val;
                },
                expire: async (k, s) => {
                    setTimeout(() => memoryStore.delete(k), s * 1000);
                }
            };
        }
    }
    return cache;
}
function resilientRateLimiter(options = {}) {
    const windowSeconds = options.windowSeconds || 60;
    const maxRequests = options.maxRequests || 120;
    const keyPrefix = options.keyPrefix || "rate_limit";
    return async (req, res, next) => {
        try {
            const clientIdentifier = req.headers["x-tenant-id"] ||
                req.authUser?.companyId ||
                req.ip ||
                "anonymous";
            const key = `${keyPrefix}:${clientIdentifier}:${Math.floor(Date.now() / (windowSeconds * 1000))}`;
            const cacheClient = getCache();
            const count = await cacheClient.incr(key);
            if (count === 1) {
                await cacheClient.expire(key, windowSeconds);
            }
            if (count > maxRequests) {
                res.setHeader("Retry-After", windowSeconds);
                res.setHeader("X-RateLimit-Limit", maxRequests);
                res.setHeader("X-RateLimit-Remaining", 0);
                return res.status(429).json({
                    error: "Too Many Requests",
                    message: `Has superado el límite de ${maxRequests} peticiones por minuto. Por favor reintenta en unos momentos.`,
                    retryAfterSeconds: windowSeconds,
                });
            }
            res.setHeader("X-RateLimit-Limit", maxRequests);
            res.setHeader("X-RateLimit-Remaining", Math.max(0, maxRequests - count));
            next();
        }
        catch (err) {
            // Fail-open strategy: rate-limiting errors never block legitimate traffic
            console.warn("[RateLimiter] Non-fatal error during rate limit evaluation:", err);
            next();
        }
    };
}
//# sourceMappingURL=rate-limiter.js.map