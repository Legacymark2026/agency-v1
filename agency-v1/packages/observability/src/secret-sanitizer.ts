/**
 * Automated Secret Sanitizer & Production Log Redactor
 * ─────────────────────────────────────────────────────────────────────────────
 * Scans objects, strings, and audit payloads to automatically redact Bearer tokens,
 * passwords, private keys, API secrets, and credit card numbers before logging.
 */

export class SecretSanitizer {
  private sensitiveKeyPatterns = [
    /pass(word)?/i,
    /secret/i,
    /token/i,
    /authorization/i,
    /api[_-]?key/i,
    /private[_-]?key/i,
    /technical[_-]?key/i,
    /cvv/i,
    /pin/i,
  ];

  /**
   * Sanitizes a string masking bearer tokens and sensitive patterns.
   */
  public sanitizeString(text: string): string {
    return text
      .replace(/Bearer\s+[A-Za-z0-9-_=.]+/gi, "Bearer [REDACTED_TOKEN]")
      .replace(/\b\d{4}[- ]?\d{4}[- ]?\d{4}[- ]?\d{4}\b/g, "[REDACTED_CREDIT_CARD]")
      .replace(/"(password|secret|technicalKey|softwarePin)":\s*"[^"]+"/gi, '"$1": "[REDACTED_SECRET]"');
  }

  /**
   * Recursively sanitizes an object, masking sensitive keys and patterns.
   */
  public sanitizePayload<T = any>(data: T): T {
    if (!data || typeof data !== "object") {
      if (typeof data === "string") {
        return this.sanitizeString(data) as any;
      }
      return data;
    }

    if (Array.isArray(data)) {
      return data.map((item) => this.sanitizePayload(item)) as any;
    }

    const sanitized: Record<string, any> = {};
    for (const [key, value] of Object.entries(data as Record<string, any>)) {
      if (/credit[_-]?card/i.test(key)) {
        sanitized[key] = "[REDACTED_CREDIT_CARD]";
      } else if (this.sensitiveKeyPatterns.some((pattern) => pattern.test(key))) {
        sanitized[key] = "[REDACTED_SECRET]";
      } else if (typeof value === "object" && value !== null) {
        sanitized[key] = this.sanitizePayload(value);
      } else if (typeof value === "string") {
        sanitized[key] = this.sanitizeString(value);
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized as T;
  }
}

export const secretSanitizer = new SecretSanitizer();
