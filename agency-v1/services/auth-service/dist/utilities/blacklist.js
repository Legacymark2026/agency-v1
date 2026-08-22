"use strict";
/**
 * services/auth-service/src/utilities/blacklist.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Redis JWT Blacklist Manager using config.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.revokeToken = revokeToken;
exports.isTokenRevoked = isTokenRevoked;
const ioredis_1 = __importDefault(require("ioredis"));
const crypto_1 = __importDefault(require("crypto"));
const env_config_1 = require("@config/env.config");
const redis = new ioredis_1.default(env_config_1.envConfig.redisUrl);
redis.on("error", (err) => {
    console.error("[auth-blacklist] Redis connection error:", err.message);
});
function hashToken(token) {
    return crypto_1.default.createHash("sha256").update(token).digest("hex");
}
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
async function isTokenRevoked(token) {
    const tokenHash = hashToken(token);
    const cacheKey = `auth:blacklist:${tokenHash}`;
    try {
        const result = await redis.get(cacheKey);
        return result !== null;
    }
    catch (err) {
        console.error("[AuthBlacklist] Failed to check token status in Redis:", err.message);
        return false;
    }
}
//# sourceMappingURL=blacklist.js.map