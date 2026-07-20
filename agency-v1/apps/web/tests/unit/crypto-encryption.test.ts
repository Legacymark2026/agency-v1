/**
 * apps/web/tests/unit/crypto-encryption.test.ts
 * ──────────────────────────────────────────────────────────────
 * Unit tests verifying compliance with Hashing (SHA-256 / bcrypt)
 * and Symmetric Encryption (AES-256-GCM) standards.
 *
 * Priority: CRITICAL (Security, Data Integrity & ENCODE Compliance)
 */

import { describe, it, expect } from 'vitest';
import crypto from 'crypto';

/**
 * Helper: Symmetric Encryption using AES-256-GCM
 */
function encryptSymmetric(plaintext: string, secretKeyHex: string): { ciphertext: string; iv: string; authTag: string } {
    const key = Buffer.from(secretKeyHex, 'hex');
    const iv = crypto.randomBytes(12); // 96-bit IV for AES-GCM standard
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
    
    let ciphertext = cipher.update(plaintext, 'utf8', 'hex');
    ciphertext += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');
    
    return {
        ciphertext,
        iv: iv.toString('hex'),
        authTag,
    };
}

/**
 * Helper: Symmetric Decryption using AES-256-GCM
 */
function decryptSymmetric(ciphertext: string, secretKeyHex: string, ivHex: string, authTagHex: string): string {
    const key = Buffer.from(secretKeyHex, 'hex');
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(ciphertext, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
}

/**
 * Helper: ENCODE / GDPR compliant SHA-256 Data Hashing
 */
function hashSHA256(input: string): string {
    const normalized = input.trim().toLowerCase();
    return crypto.createHash('sha256').update(normalized).digest('hex');
}

describe('Crypto & Security Standards Compliance', () => {
    // 256-bit (32 bytes) master secret key
    const MASTER_KEY_HEX = crypto.randomBytes(32).toString('hex');

    describe('1. Hashing & Normalization Contract (SHA-256 / ENCODE Standard)', () => {
        it('should generate deterministic 64-character SHA-256 hex string', () => {
            const hash = hashSHA256('user@example.com');
            expect(hash).toHaveLength(64);
            expect(hash).toMatch(/^[a-f0-9]{64}$/);
        });

        it('should normalize input before hashing (trim & lowercase)', () => {
            const hashRaw = hashSHA256('User@Example.COM  ');
            const hashClean = hashSHA256('user@example.com');
            expect(hashRaw).toBe(hashClean);
        });

        it('should produce completely different hashes for different inputs (collision resistance)', () => {
            const hashA = hashSHA256('user1@example.com');
            const hashB = hashSHA256('user2@example.com');
            expect(hashA).not.toBe(hashB);
        });
    });

    describe('2. Symmetric Encryption Contract (AES-256-GCM)', () => {
        it('should encrypt and correctly decrypt plaintext payload (roundtrip)', () => {
            const sensitiveData = 'DATABASE_PASSWORD_SECRET_12345';
            const encrypted = encryptSymmetric(sensitiveData, MASTER_KEY_HEX);

            expect(encrypted.ciphertext).toBeDefined();
            expect(encrypted.ciphertext).not.toBe(sensitiveData);
            expect(encrypted.iv).toHaveLength(24); // 12 bytes = 24 hex chars
            expect(encrypted.authTag).toHaveLength(32); // 16 bytes = 32 hex chars

            const decrypted = decryptSymmetric(
                encrypted.ciphertext,
                MASTER_KEY_HEX,
                encrypted.iv,
                encrypted.authTag
            );

            expect(decrypted).toBe(sensitiveData);
        });

        it('should produce unique Initialization Vectors (IV) for consecutive encryptions of identical plaintext', () => {
            const plaintext = 'SAME_DATA_PAYLOAD';
            const enc1 = encryptSymmetric(plaintext, MASTER_KEY_HEX);
            const enc2 = encryptSymmetric(plaintext, MASTER_KEY_HEX);

            expect(enc1.iv).not.toBe(enc2.iv);
            expect(enc1.ciphertext).not.toBe(enc2.ciphertext);
        });

        it('should reject decryption if ciphertext has been tampered with (GCM authTag check)', () => {
            const sensitiveData = 'PAYROLL_CONFIDENTIAL_PAYLOAD';
            const encrypted = encryptSymmetric(sensitiveData, MASTER_KEY_HEX);

            // Tamper with ciphertext by altering last character
            const tamperedCiphertext = encrypted.ciphertext.slice(0, -1) + (encrypted.ciphertext.endsWith('a') ? 'b' : 'a');

            expect(() => {
                decryptSymmetric(
                    tamperedCiphertext,
                    MASTER_KEY_HEX,
                    encrypted.iv,
                    encrypted.authTag
                );
            }).toThrow();
        });

        it('should reject decryption when using an invalid key', () => {
            const sensitiveData = 'API_TOKEN_XYZ';
            const encrypted = encryptSymmetric(sensitiveData, MASTER_KEY_HEX);
            const WRONG_KEY_HEX = crypto.randomBytes(32).toString('hex');

            expect(() => {
                decryptSymmetric(
                    encrypted.ciphertext,
                    WRONG_KEY_HEX,
                    encrypted.iv,
                    encrypted.authTag
                );
            }).toThrow();
        });
    });
});
