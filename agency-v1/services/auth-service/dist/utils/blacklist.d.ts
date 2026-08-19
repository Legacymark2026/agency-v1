/**
 * services/auth-service/src/utils/blacklist.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Redis JWT Blacklist Manager
 * Stores SHA-256 hashes of revoked tokens with dynamic TTL expiration.
 */
/**
 * Revokes a token by storing its hash in Redis with a TTL.
 * @param token Raw JWT token string
 * @param expiresInSeconds TTL remaining for token expiration
 */
export declare function revokeToken(token: string, expiresInSeconds: number): Promise<void>;
/**
 * Checks if a token hash exists in the Redis blacklist.
 * @param token Raw JWT token string
 */
export declare function isTokenRevoked(token: string): Promise<boolean>;
