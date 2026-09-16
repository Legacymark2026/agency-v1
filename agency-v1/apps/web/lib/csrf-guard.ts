/**
 * Anti-CSRF Token Generation & Double-Submit Protection Guard
 * ─────────────────────────────────────────────────────────────────────────────
 * Provides cryptographically secure CSRF token generation and validation
 * with HMAC SHA-256 signatures to protect state-mutating requests (POST, PUT, DELETE).
 */

import crypto from "crypto";

const CSRF_SECRET = (() => {
  const secret = process.env.CSRF_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === "production" && process.env.NEXT_PHASE !== "phase-production-build") {
      throw new Error("[FATAL] CSRF_SECRET no está configurado en producción. Es obligatorio para la protección Anti-CSRF.");
    }
    return "legacymark-dev-csrf-secret-only-for-development-mode!";
  }
  return secret;
})();

export interface CSRFTokenData {
  token: string;
  signature: string;
  timestamp: number;
}

export class CSRFGuard {
  /**
   * Generates a signed CSRF token.
   */
  public generateToken(sessionId: string): string {
    const timestamp = Date.now();
    const nonce = crypto.randomBytes(16).toString("hex");
    const payload = `${sessionId}:${timestamp}:${nonce}`;
    const signature = crypto.createHmac("sha256", CSRF_SECRET).update(payload).digest("hex");

    return Buffer.from(JSON.stringify({ payload, signature })).toString("base64url");
  }

  /**
   * Validates a submitted CSRF token against the user's session.
   */
  public validateToken(tokenString: string, sessionId: string, maxAgeMs = 24 * 60 * 60 * 1000): boolean {
    if (!tokenString || !sessionId) return false;

    try {
      const decoded = JSON.parse(Buffer.from(tokenString, "base64url").toString("utf-8"));
      if (!decoded.payload || !decoded.signature) return false;

      const [tokenSessionId, timestampStr] = decoded.payload.split(":");
      if (tokenSessionId !== sessionId) return false;

      const timestamp = parseInt(timestampStr, 10);
      if (Date.now() - timestamp > maxAgeMs) return false; // Token expired

      const expectedSignature = crypto.createHmac("sha256", CSRF_SECRET).update(decoded.payload).digest("hex");
      return crypto.timingSafeEqual(Buffer.from(decoded.signature), Buffer.from(expectedSignature));
    } catch {
      return false;
    }
  }
}

export const csrfGuard = new CSRFGuard();
