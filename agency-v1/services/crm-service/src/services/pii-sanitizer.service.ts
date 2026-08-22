/**
 * Automated PII Data Sanitizer & Redactor (GDPR / HIPAA)
 * ─────────────────────────────────────────────────────────────────────────────
 * Redacts Personally Identifiable Information (Credit Cards, Passwords, National IDs)
 * before storing or logging payload data.
 */

export function sanitizePIIData(input: string): string {
  if (!input) return "";

  let sanitized = input;

  // Credit Card Numbers (13 to 16 digits)
  sanitized = sanitized.replace(/\b(?:\d[ -]*?){13,16}\b/g, "[REDACTED_CREDIT_CARD]");

  // Passwords in JSON / query strings
  sanitized = sanitized.replace(/(["']?(?:password|pass|secret|token)["']?\s*[:=]\s*["'])([^"']+)(["'])/gi, "$1[REDACTED_SECRET]$3");

  // National IDs / SSN (e.g. 9-10 digits)
  sanitized = sanitized.replace(/\b\d{3}-\d{2}-\d{4}\b/g, "[REDACTED_SSN]");

  return sanitized;
}

export function sanitizeObjectPII<T extends Record<string, any>>(obj: T): T {
  if (!obj || typeof obj !== "object") return obj;

  const copy = JSON.parse(JSON.stringify(obj));
  const sensitiveKeys = ["password", "secret", "creditCard", "cvv", "accessToken", "refreshToken"];

  const redactRecursive = (target: any) => {
    if (typeof target !== "object" || target === null) return;
    for (const key of Object.keys(target)) {
      if (sensitiveKeys.some((sk) => key.toLowerCase().includes(sk.toLowerCase()))) {
        target[key] = "[REDACTED]";
      } else if (typeof target[key] === "string") {
        target[key] = sanitizePIIData(target[key]);
      } else if (typeof target[key] === "object") {
        redactRecursive(target[key]);
      }
    }
  };

  redactRecursive(copy);
  return copy;
}
