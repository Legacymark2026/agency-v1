/**
 * services/auth-service/src/config/env.config.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Centralized Environment Configuration
 */

export const envConfig = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: parseInt(process.env.PORT || "4001", 10),
  grpcPort: parseInt(process.env.GRPC_PORT || "50051", 10),
  redisUrl: process.env.REDIS_URL || "redis://localhost:6379",
  allowedOrigins: process.env.ALLOWED_ORIGINS?.split(",") || ["http://localhost:3000"],
  jwtSecret: process.env.JWT_SECRET || "legacymark_jwt_secret_dev_2026",
  dbEncryptionKey: process.env.DB_ENCRYPTION_KEY || "fallback_db_encryption_key_minimum_32_bytes",
  vaultAddr: process.env.VAULT_ADDR || "http://127.0.0.1:8200",
  vaultToken: process.env.VAULT_TOKEN || "",
};
