/**
 * services/auth-service/src/utilities/blacklist.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Redis JWT Blacklist Manager using config.
 */
export declare function revokeToken(token: string, expiresInSeconds: number): Promise<void>;
export declare function isTokenRevoked(token: string): Promise<boolean>;
