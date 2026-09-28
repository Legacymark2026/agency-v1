"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.encryptPII = encryptPII;
exports.decryptPII = decryptPII;
const crypto = __importStar(require("crypto"));
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const TAG_LENGTH = 16;
function getKey() {
    const secret = process.env.PII_ENCRYPTION_KEY;
    if (!secret) {
        throw new Error('PII_ENCRYPTION_KEY environment variable is missing.');
    }
    // Ensure the key is exactly 32 bytes for aes-256-gcm
    const keyBuffer = Buffer.from(secret, 'utf-8');
    if (keyBuffer.length !== 32) {
        throw new Error('PII_ENCRYPTION_KEY must be exactly 32 bytes long.');
    }
    return keyBuffer;
}
/**
 * Encrypts a string using AES-256-GCM for PII protection.
 * @param text The plain text to encrypt.
 * @returns The encrypted string encoded in base64 (format: iv + tag + encrypted text).
 */
function encryptPII(text) {
    if (!text)
        return text;
    const key = getKey();
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();
    return Buffer.concat([iv, tag, encrypted]).toString('base64');
}
/**
 * Decrypts a string previously encrypted with encryptPII.
 * @param hash The encrypted string in base64.
 * @returns The decrypted plain text.
 */
function decryptPII(hash) {
    if (!hash)
        return hash;
    const key = getKey();
    const buffer = Buffer.from(hash, 'base64');
    const iv = buffer.subarray(0, IV_LENGTH);
    const tag = buffer.subarray(IV_LENGTH, IV_LENGTH + TAG_LENGTH);
    const encrypted = buffer.subarray(IV_LENGTH + TAG_LENGTH);
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);
    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
    return decrypted.toString('utf8');
}
//# sourceMappingURL=crypto.js.map