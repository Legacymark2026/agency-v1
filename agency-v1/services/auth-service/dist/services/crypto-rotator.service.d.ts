/**
 * AES-256-GCM Envelope Encryption & Key Rotator Service
 * ─────────────────────────────────────────────────────────────────────────────
 * Provides authenticated AES-256-GCM data encryption at rest with key versioning
 * and automated key rotation.
 */
export interface EncryptedPayload {
    cipherText: string;
    iv: string;
    authTag: string;
    keyVersion: string;
}
export declare class EnvelopeCryptoService {
    private activeKeyVersion;
    private keys;
    constructor();
    encrypt(plainText: string): EncryptedPayload;
    decrypt(payload: EncryptedPayload): string;
}
export declare const envelopeCrypto: EnvelopeCryptoService;
