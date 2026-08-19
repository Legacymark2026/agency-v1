/**
 * services/auth-service/src/utils/crypto.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * AES-256-GCM Field-Level Encryption Helper
 * Protects sensitive database fields (MFA Secrets, phone numbers, backups) in storage.
 */
/**
 * Encrypts cleartext string to AES-256-GCM ciphertext format:
 * iv_hex:auth_tag_hex:encrypted_hex
 */
export declare function encrypt(text: string): string;
/**
 * Decrypts AES-256-GCM ciphertext back to cleartext.
 */
export declare function decrypt(encryptedText: string): string;
