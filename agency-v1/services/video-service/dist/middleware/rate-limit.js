"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRateLimiter = getRateLimiter;
exports.rateLimitMiddleware = rateLimitMiddleware;
exports.getRateLimitStatus = getRateLimitStatus;
const rate_limiter_flexible_1 = require("rate-limiter-flexible");
const ioredis_1 = require("ioredis");
let rateLimiter = null;
function getRateLimiter() {
    if (!rateLimiter) {
        rateLimiter = new rate_limiter_flexible_1.RateLimiterRedis({
            storeClient: new ioredis_1.Redis(process.env.REDIS_URL || 'redis://localhost:6379'),
            keyPrefix: 'video_rate_limit',
            points: parseInt(process.env.RENDER_RATE_LIMIT || '10'),
            duration: parseInt(process.env.RENDER_RATE_WINDOW || '3600'),
            blockDuration: parseInt(process.env.RENDER_RATE_BLOCK || '300'),
        });
    }
    return rateLimiter;
}
function rateLimitMiddleware(req, res, next) {
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
async function getRateLimitStatus(companyId) {
    const limiter = getRateLimiter();
    try {
        const status = await limiter.get(companyId);
        return {
            limit: parseInt(process.env.RENDER_RATE_LIMIT || '10'),
            remaining: status ? status.remainingPoints : parseInt(process.env.RENDER_RATE_LIMIT || '10'),
            reset: status ? new Date(Date.now() + status.msBeforeNext) : new Date(),
            blocked: false,
        };
    }
    catch {
        return {
            limit: parseInt(process.env.RENDER_RATE_LIMIT || '10'),
            remaining: 0,
            reset: new Date(Date.now() + 300000),
            blocked: true,
        };
    }
}
//# sourceMappingURL=rate-limit.js.map