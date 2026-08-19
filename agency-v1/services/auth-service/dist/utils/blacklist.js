"use strict";
/**
 * services/auth-service/src/utils/blacklist.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Redis JWT Blacklist Manager
 * Stores SHA-256 hashes of revoked tokens with dynamic TTL expiration.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.revokeToken = revokeToken;
exports.isTokenRevoked = isTokenRevoked;
const ioredis_1 = __importDefault(require("ioredis"));
const crypto_1 = __importDefault(require("crypto"));
const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";
const redis = new ioredis_1.default(REDIS_URL);
redis.on("error", (err) => {
    console.error("[auth-blacklist] Redis connection error:", err.message);
});
function hashToken(token) {
    return crypto_1.default.createHash("sha256").update(token).digest("hex");
}
/**
 * Revokes a token by storing its hash in Redis with a TTL.
 * @param token Raw JWT token string
 * @param expiresInSeconds TTL remaining for token expiration
 */
async function revokeToken(token, expiresInSeconds) {
    if (expiresInSeconds <= 0)
        return;
    const tokenHash = hashToken(token);
    const cacheKey = `auth:blacklist:${tokenHash}`;
    try {
        await redis.setex(cacheKey, expiresInSeconds, "revoked");
        console.log(`🎫 [AuthBlacklist] Token revoked. Hash: ${tokenHash}. TTL: ${expiresInSeconds}s`);
    }
    catch (err) {
        console.error("[AuthBlacklist] Failed to revoke token in Redis:", err.message);
    }
}
/**
 * Checks if a token hash exists in the Redis blacklist.
 * @param token Raw JWT token string
 */
async function isTokenRevoked(token) {
    const tokenHash = hashToken(token);
    const cacheKey = `auth:blacklist:${tokenHash}`;
    try {
        const result = await redis.get(cacheKey);
        return result !== null;
    }
    catch (err) {
        console.error("[AuthBlacklist] Failed to check token status in Redis:", err.message);
        return false; // Fail-open to avoid locking out users in case of cache outage
    }
}
//# sourceMappingURL=blacklist.js.map