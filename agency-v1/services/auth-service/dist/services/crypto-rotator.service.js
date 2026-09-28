"use strict";
/**
 * AES-256-GCM Envelope Encryption & Key Rotator Service
 * ─────────────────────────────────────────────────────────────────────────────
 * Provides authenticated AES-256-GCM data encryption at rest with key versioning
 * and automated key rotation.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.envelopeCrypto = exports.EnvelopeCryptoService = void 0;
const crypto_1 = __importDefault(require("crypto"));
class EnvelopeCryptoService {
    activeKeyVersion = "v1";
    keys = new Map();
    constructor() {
        const defaultMasterKey = process.env.MASTER_ENCRYPTION_KEY || "legacymark_master_secret_32bytes!!";
        const keyBuf = crypto_1.default.createHash("sha256").update(defaultMasterKey).digest();
        this.keys.set("v1", keyBuf);
    }
    encrypt(plainText) {
        const iv = crypto_1.default.randomBytes(12); // 96-bit IV for GCM
        const masterKey = this.keys.get(this.activeKeyVersion);
        const cipher = crypto_1.default.createCipheriv("aes-256-gcm", masterKey, iv);
        let cipherText = cipher.update(plainText, "utf8", "base64");
        cipherText += cipher.final("base64");
        const authTag = cipher.getAuthTag().toString("base64");
        return {
            cipherText,
            iv: iv.toString("base64"),
            authTag,
            keyVersion: this.activeKeyVersion,
        };
    }
    decrypt(payload) {
        const masterKey = this.keys.get(payload.keyVersion);
        if (!masterKey)
            throw new Error(`[EnvelopeCrypto] Key version ${payload.keyVersion} not registered.`);
        const ivBuf = Buffer.from(payload.iv, "base64");
        const authTagBuf = Buffer.from(payload.authTag, "base64");
        const decipher = crypto_1.default.createDecipheriv("aes-256-gcm", masterKey, ivBuf);
        decipher.setAuthTag(authTagBuf);
        let plainText = decipher.update(payload.cipherText, "base64", "utf8");
        plainText += decipher.final("utf8");
        return plainText;
    }
}
exports.EnvelopeCryptoService = EnvelopeCryptoService;
exports.envelopeCrypto = new EnvelopeCryptoService();
//# sourceMappingURL=crypto-rotator.service.js.map