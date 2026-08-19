"use strict";
/**
 * services/auth-service/src/utils/crypto.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * AES-256-GCM Field-Level Encryption Helper
 * Protects sensitive database fields (MFA Secrets, phone numbers, backups) in storage.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.encrypt = encrypt;
exports.decrypt = decrypt;
const crypto_1 = __importDefault(require("crypto"));
const ALGORITHM = "aes-256-gcm";
// Derive a 32-byte encryption key from the environment secret
const ENCRYPTION_KEY = crypto_1.default
    .createHash("sha256")
    .update(process.env.DB_ENCRYPTION_KEY || "fallback_db_encryption_key_minimum_32_bytes")
    .digest();
/**
 * Encrypts cleartext string to AES-256-GCM ciphertext format:
 * iv_hex:auth_tag_hex:encrypted_hex
 */
function encrypt(text) {
    const iv = crypto_1.default.randomBytes(12); // 12-byte initialization vector (standard for GCM)
    const cipher = crypto_1.default.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
    let encrypted = cipher.update(text, "utf8", "hex");
    encrypted += cipher.final("hex");
    const tag = cipher.getAuthTag().toString("hex"); // 16-byte authentication tag
    return `${iv.toString("hex")}:${tag}:${encrypted}`;
}
/**
 * Decrypts AES-256-GCM ciphertext back to cleartext.
 */
function decrypt(encryptedText) {
    try {
        const parts = encryptedText.split(":");
        if (parts.length !== 3) {
            return encryptedText; // Pass through if not in encrypted format
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
        // Return original string if decryption fails (fallback for legacy cleartext values)
        return encryptedText;
    }
}
//# sourceMappingURL=crypto.js.map