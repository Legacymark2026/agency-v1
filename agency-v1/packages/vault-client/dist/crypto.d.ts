/**
 * Encrypts a string using AES-256-GCM for PII protection.
 * @param text The plain text to encrypt.
 * @returns The encrypted string encoded in base64 (format: iv + tag + encrypted text).
 */
export declare function encryptPII(text: string): string;
/**
 * Decrypts a string previously encrypted with encryptPII.
 * @param hash The encrypted string in base64.
 * @returns The decrypted plain text.
 */
export declare function decryptPII(hash: string): string;
//# sourceMappingURL=crypto.d.ts.map