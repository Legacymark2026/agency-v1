"use strict";
/**
 * services/auth-service/src/utilities/crypto.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * AES-256-GCM Field-Level Encryption Helper using config.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.encrypt = encrypt;
exports.decrypt = decrypt;
const crypto_1 = __importDefault(require("crypto"));
const env_config_1 = require("@config/env.config");
const ALGORITHM = "aes-256-gcm";
const ENCRYPTION_KEY = crypto_1.default
    .createHash("sha256")
    .update(env_config_1.envConfig.dbEncryptionKey)
    .digest();
function encrypt(text) {
    const iv = crypto_1.default.randomBytes(12);
    const cipher = crypto_1.default.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
    let encrypted = cipher.update(text, "utf8", "hex");
    encrypted += cipher.final("hex");
    const tag = cipher.getAuthTag().toString("hex");
    return `${iv.toString("hex")}:${tag}:${encrypted}`;
}
function decrypt(encryptedText) {
    try {
        const parts = encryptedText.split(":");
        if (parts.length !== 3) {
            return encryptedText;
        }
        const iv = Buffer.from(parts[0], "hex");
        const tag = Buffer.from(parts[1], "hex");
        const encrypted = Buffer.from(parts[2], "hex");
        const decipher = crypto_1.default.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
        decipher.setAuthTag(tag);
        let decrypted = decipher.update(encrypted, undefined, "utf8");
        decrypted += decipher.final("utf8");
        return decrypted;
    }
    catch (err) {
        return encryptedText;
    }
}
//# sourceMappingURL=crypto.js.map