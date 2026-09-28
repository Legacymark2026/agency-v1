/**
 * Automated Secret Sanitizer & Production Log Redactor
 * ─────────────────────────────────────────────────────────────────────────────
 * Scans objects, strings, and audit payloads to automatically redact Bearer tokens,
 * passwords, private keys, API secrets, and credit card numbers before logging.
 */
export declare class SecretSanitizer {
    private sensitiveKeyPatterns;
    /**
     * Sanitizes a string masking bearer tokens and sensitive patterns.
     */
    sanitizeString(text: string): string;
    /**
     * Recursively sanitizes an object, masking sensitive keys and patterns.
     */
    sanitizePayload<T = any>(data: T): T;
}
export declare const secretSanitizer: SecretSanitizer;
//# sourceMappingURL=secret-sanitizer.d.ts.map