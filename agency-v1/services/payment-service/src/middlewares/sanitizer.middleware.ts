/**
 * PCI DSS v4.0 Zero-PAN & Sensitive Authentication Data (SAD) Sanitizer Middleware
 * ─────────────────────────────────────────────────────────────────────────────
 * Prevents accidental logging or storage of Primary Account Numbers (PANs),
 * CVVs, and PINs. Implements strict card masking: BIN (6) + Last 4 only.
 */
import { Request, Response, NextFunction } from "express";

const PAN_REGEX = /\b(?:\d{4}[ -]?){3}(?:\d{1,4})\b/g;
const CVV_REGEX = /\b\d{3,4}\b/;

export function maskPAN(pan: string): string {
  const clean = pan.replace(/[\s-]/g, "");
  if (clean.length < 13 || clean.length > 19) return pan;
  const first6 = clean.slice(0, 6);
  const last4 = clean.slice(-4);
  const maskedMiddle = "*".repeat(clean.length - 10);
  return `${first6}${maskedMiddle}${last4}`;
}

export function sanitizePayloadRecursively(obj: any): any {
  if (!obj || typeof obj !== "object") {
    if (typeof obj === "string") {
      return obj.replace(PAN_REGEX, (match) => maskPAN(match));
    }
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizePayloadRecursively(item));
  }

  const sanitized: Record<string, any> = {};

  for (const [key, value] of Object.entries(obj)) {
    const lowerKey = key.toLowerCase();

    // Sensitive Authentication Data (SAD) -> Strict Complete Redaction
    if (["cvv", "cvc", "cvv2", "pin", "card_security_code", "secret"].includes(lowerKey)) {
      sanitized[key] = "[REDACTED_SAD]";
      continue;
    }

    // Card numbers -> Mask with BIN + Last 4
    if (["pan", "cardnumber", "card_number", "numero_tarjeta"].includes(lowerKey)) {
      sanitized[key] = typeof value === "string" ? maskPAN(value) : "[REDACTED_PAN]";
      continue;
    }

    sanitized[key] = sanitizePayloadRecursively(value);
  }

  return sanitized;
}

export function pciDssSanitizerMiddleware(req: Request, _res: Response, next: NextFunction) {
  if (req.body && typeof req.body === "object") {
    req.body = sanitizePayloadRecursively(req.body);
  }
  next();
}
