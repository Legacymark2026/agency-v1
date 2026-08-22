/**
 * services/auth-service/src/config/env.config.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Centralized Environment Configuration
 */
export declare const envConfig: {
    nodeEnv: string;
    port: number;
    grpcPort: number;
    redisUrl: string;
    allowedOrigins: string[];
    jwtSecret: string;
    dbEncryptionKey: string;
    vaultAddr: string;
    vaultToken: string;
};
