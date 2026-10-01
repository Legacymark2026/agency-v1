"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.KmsService = void 0;
/**
 * Key Management Service (KMS)
 * Cifra llaves de API usando AES-256-GCM
 */
const crypto_1 = __importDefault(require("crypto"));
// En prod, esto debe venir del entorno o de un Vault. Fallback local para dev.
const KMS_MASTER_KEY = process.env.KMS_MASTER_KEY || "a2b4c6d8e0f1234567890abcdef1234567890abcdef1234567890abcdef12345";
class KmsService {
    static getAlgorithm() { return 'aes-256-gcm'; }
    static getKey() {
        return Buffer.from(KMS_MASTER_KEY.substring(0, 32), 'utf-8');
    }
    static encrypt(plainText) {
        if (!plainText)
            return { cipherText: "", iv: "", authTag: "" };
        const iv = crypto_1.default.randomBytes(12);
        const cipher = crypto_1.default.createCipheriv(this.getAlgorithm(), this.getKey(), iv);
        let encrypted = cipher.update(plainText, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        const authTag = cipher.getAuthTag().toString('hex');
        return {
            cipherText: encrypted,
            iv: iv.toString('hex'),
            authTag: authTag
        };
    }
    static decrypt(cipherText, ivHex, authTagHex) {
        if (!cipherText || !ivHex || !authTagHex)
            return "";
        const iv = Buffer.from(ivHex, 'hex');
        const authTag = Buffer.from(authTagHex, 'hex');
        const decipher = crypto_1.default.createDecipheriv(this.getAlgorithm(), this.getKey(), iv);
        decipher.setAuthTag(authTag);
        let decrypted = decipher.update(cipherText, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    }
}
exports.KmsService = KmsService;
