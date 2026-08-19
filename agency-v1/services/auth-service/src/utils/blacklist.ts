/**
 * services/auth-service/src/utils/blacklist.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Redis JWT Blacklist Manager
 * Stores SHA-256 hashes of revoked tokens with dynamic TTL expiration.
 */

import Redis from "ioredis";
import crypto from "crypto";

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";
const redis = new Redis(REDIS_URL);

redis.on("error", (err) => {
  console.error("[auth-blacklist] Redis connection error:", err.message);
});

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

/**
 * Revokes a token by storing its hash in Redis with a TTL.
 * @param token Raw JWT token string
 * @param expiresInSeconds TTL remaining for token expiration
 */
export async function revokeToken(token: string, expiresInSeconds: number): Promise<void> {
  if (expiresInSeconds <= 0) return;
  const tokenHash = hashToken(token);
  const cacheKey = `auth:blacklist:${tokenHash}`;
  
  try {
    await redis.setex(cacheKey, expiresInSeconds, "revoked");
    console.log(`🎫 [AuthBlacklist] Token revoked. Hash: ${tokenHash}. TTL: ${expiresInSeconds}s`);
  } catch (err: any) {
    console.error("[AuthBlacklist] Failed to revoke token in Redis:", err.message);
  }
}

/**
 * Checks if a token hash exists in the Redis blacklist.
 * @param token Raw JWT token string
 */
export async function isTokenRevoked(token: string): Promise<boolean> {
  const tokenHash = hashToken(token);
  const cacheKey = `auth:blacklist:${tokenHash}`;
  
  try {
    const result = await redis.get(cacheKey);
    return result !== null;
  } catch (err: any) {
    console.error("[AuthBlacklist] Failed to check token status in Redis:", err.message);
    return false; // Fail-open to avoid locking out users in case of cache outage
  }
}
