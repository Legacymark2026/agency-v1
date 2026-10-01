"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.idempotencyMiddleware = idempotencyMiddleware;
exports.resetIdempotencyCache = resetIdempotencyCache;
const crypto_1 = __importDefault(require("crypto"));
const ioredis_1 = __importDefault(require("ioredis"));
const REDIS_URL = process.env.REDIS_URL || "redis://redis:6379";
const IDEMPOTENCY_TTL_SECONDS = 86400; // 24 hours
const LOCK_TTL_SECONDS = 30; // Max time a request can be in-flight
let redisClient = null;
function getRedis() {
    if (!redisClient) {
        redisClient = new ioredis_1.default(REDIS_URL, {
            maxRetriesPerRequest: 1,
            enableReadyCheck: false,
            lazyConnect: true,
        });
        redisClient.on("error", (err) => {
            console.warn("[Idempotency] Redis connection error (degraded mode — in-memory fallback active):", err.message);
        });
    }
    return redisClient;
}
// In-memory fallback for when Redis is unavailable
const LOCAL_CACHE = new Map();
const LOCAL_LOCKS = new Set();
async function getCached(key) {
    try {
        const raw = await getRedis().get(`idempotency:response:${key}`);
        if (raw)
            return JSON.parse(raw);
    }
    catch {
        const local = LOCAL_CACHE.get(key);
        if (local)
            return local;
    }
    return null;
}
async function setCached(key, value) {
    try {
        await getRedis().setex(`idempotency:response:${key}`, IDEMPOTENCY_TTL_SECONDS, JSON.stringify(value));
    }
    catch {
        LOCAL_CACHE.set(key, value);
        // Cleanup old entries to prevent unbounded memory growth
        if (LOCAL_CACHE.size > 10000) {
            const firstKey = LOCAL_CACHE.keys().next().value;
            if (firstKey)
                LOCAL_CACHE.delete(firstKey);
        }
    }
}
async function acquireLock(key) {
    try {
        const result = await getRedis().set(`idempotency:lock:${key}`, "1", "EX", LOCK_TTL_SECONDS, "NX");
        return result === "OK";
    }
    catch {
        if (LOCAL_LOCKS.has(key))
            return false;
        LOCAL_LOCKS.add(key);
        return true;
    }
}
async function releaseLock(key) {
    try {
        await getRedis().del(`idempotency:lock:${key}`);
    }
    catch {
        LOCAL_LOCKS.delete(key);
    }
}
function idempotencyMiddleware(req, res, next) {
    if (!["POST", "PUT", "PATCH"].includes(req.method))
        return next();
    const idempotencyKey = (req.headers["idempotency-key"] || req.headers["x-idempotency-key"]);
    if (!idempotencyKey)
        return next();
    const requestHash = crypto_1.default
        .createHash("sha256")
        .update(`${req.method}:${req.originalUrl}:${JSON.stringify(req.body || {})}`)
        .digest("hex");
    // Run async idempotency check
    (async () => {
        // 1. Check for cached response
        const cached = await getCached(idempotencyKey);
        if (cached) {
            if (cached.requestHash !== requestHash) {
                return res.status(422).json({
                    error: "Idempotency key reused with different request parameters",
                    code: "IDEMPOTENCY_MISMATCH",
                });
            }
            res.setHeader("X-Idempotency-Lookup", "HIT");
            res.setHeader("X-Idempotency-Key", idempotencyKey);
            return res.status(cached.statusCode).json(cached.body);
        }
        // 2. Acquire distributed lock
        const acquired = await acquireLock(idempotencyKey);
        if (!acquired) {
            return res.status(409).json({
                error: "Concurrent request with the same idempotency key is currently in flight",
                code: "IDEMPOTENCY_IN_FLIGHT",
            });
        }
        // 3. Intercept response to cache it
        const originalJson = res.json.bind(res);
        res.json = (body) => {
            releaseLock(idempotencyKey).catch(() => { });
            if (res.statusCode < 500) {
                setCached(idempotencyKey, { statusCode: res.statusCode, body, requestHash, timestamp: Date.now() }).catch(() => { });
            }
            res.setHeader("X-Idempotency-Lookup", "MISS");
            res.setHeader("X-Idempotency-Key", idempotencyKey);
            return originalJson(body);
        };
        next();
    })().catch((err) => {
        console.error("[Idempotency] Unexpected error, allowing request through:", err.message);
        next();
    });
}
/** Reset caches (for testing) */
function resetIdempotencyCache() {
    LOCAL_CACHE.clear();
    LOCAL_LOCKS.clear();
}
