/**
 * services/auth-service/src/utilities/blacklist.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Redis JWT Blacklist Manager using config.
 */

import Redis from "ioredis";
import crypto from "crypto";
import { envConfig } from "@config/env.config";

const redis = new Redis(envConfig.redisUrl);

redis.on("error", (err) => {
  console.error("[auth-blacklist] Redis connection error:", err.message);
});

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

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

export async function isTokenRevoked(token: string): Promise<boolean> {
  const tokenHash = hashToken(token);
  const cacheKey = `auth:blacklist:${tokenHash}`;
  
  try {
    const result = await redis.get(cacheKey);
    return result !== null;
  } catch (err: any) {
    console.error("[AuthBlacklist] Failed to check token status in Redis:", err.message);
    return false;
  }
}
