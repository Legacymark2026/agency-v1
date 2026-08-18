/**
 * lib/mfa.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * MFA (Multi-Factor Authentication) — Production-Grade TOTP Implementation
 * 
 * Security Audit Fixes Applied:
 *   C-1: Real TOTP verification using HMAC-based OTP (RFC 6238)
 *   M-1: CSPRNG (crypto.randomBytes) for backup code generation
 *   L-2: Base32-encoded secret generation for TOTP compatibility
 *   L-5: Fixed MFA schema validation for backup code length
 */

import { z } from "zod";
import { randomBytes, createHmac } from "crypto";

const ISSUER = "LegacyMark";

export interface MFSecret {
  secret: string;
  otpauthUrl: string;
}

function getMfaIssuer(): string {
  return process.env.MFA_ISSUER || ISSUER;
}

// ── Base32 encoding (RFC 4648) for TOTP secret compatibility ──────────────
const BASE32_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

function base32Encode(buffer: Buffer): string {
  let bits = 0;
  let value = 0;
  let output = "";
  for (let i = 0; i < buffer.length; i++) {
    value = (value << 8) | buffer[i];
    bits += 8;
    while (bits >= 5) {
      output += BASE32_CHARS[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) {
    output += BASE32_CHARS[(value << (5 - bits)) & 31];
  }
  return output;
}

function base32Decode(encoded: string): Buffer {
  const cleanInput = encoded.replace(/[=\s]/g, "").toUpperCase();
  let bits = 0;
  let value = 0;
  const output: number[] = [];
  for (const char of cleanInput) {
    const idx = BASE32_CHARS.indexOf(char);
    if (idx === -1) continue;
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      output.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }
  return Buffer.from(output);
}

// ── C-1 FIX: Real TOTP generation (RFC 6238 / HMAC-SHA1) ─────────────────

function generateTOTP(secret: string, timeStep: number = 0): string {
  const secretBuffer = base32Decode(secret);
  const time = Math.floor(Date.now() / 1000 / 30) + timeStep;
  const timeBuffer = Buffer.alloc(8);
  // Write as big-endian 64-bit integer
  timeBuffer.writeUInt32BE(0, 0);
  timeBuffer.writeUInt32BE(time, 4);

  const hmac = createHmac("sha1", secretBuffer);
  hmac.update(timeBuffer);
  const hash = hmac.digest();

  // Dynamic truncation (RFC 4226 §5.4)
  const offset = hash[hash.length - 1] & 0x0f;
  const binary =
    ((hash[offset] & 0x7f) << 24) |
    ((hash[offset + 1] & 0xff) << 16) |
    ((hash[offset + 2] & 0xff) << 8) |
    (hash[offset + 3] & 0xff);

  const otp = binary % 1_000_000;
  return otp.toString().padStart(6, "0");
}

// ── L-2 FIX: Generate proper Base32 TOTP secret ──────────────────────────

export function generateSecret(email: string): MFSecret {
  // Generate 20 random bytes (160 bits) — standard for TOTP
  const secretBuffer = randomBytes(20);
  const secret = base32Encode(secretBuffer);
  const mfaIssuer = getMfaIssuer();
  const otpauthUrl = `otpauth://totp/${encodeURIComponent(mfaIssuer)}:${encodeURIComponent(email)}?secret=${secret}&issuer=${encodeURIComponent(mfaIssuer)}&algorithm=SHA1&digits=6&period=30`;

  return { secret, otpauthUrl };
}

export async function generateQRCode(data: string): Promise<string> {
  try {
    const QRCode = await import("qrcode");
    const qrCodeData = await QRCode.toDataURL(data, {
      width: 200,
      margin: 2,
      color: {
        dark: "#0f172a",
        light: "#ffffff",
      },
    });
    return qrCodeData;
  } catch {
    console.warn("[MFA] QRCode generation failed, returning empty string");
    return "";
  }
}

// ── M-1 FIX: Use CSPRNG (crypto.randomBytes) for backup codes ────────────

export function generateBackupCodes(count: number = 10): string[] {
  const codes: string[] = [];
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ2345679";

  for (let i = 0; i < count; i++) {
    const randomBuffer = randomBytes(8);
    let code = "";
    for (let j = 0; j < 8; j++) {
      if (j === 4) code += "-";
      code += chars.charAt(randomBuffer[j] % chars.length);
    }
    codes.push(code.toUpperCase());
  }

  return codes;
}

// ── C-1 FIX: Real TOTP verification with ±1 time window tolerance ────────

export function verifyToken(token: string, secret: string): boolean {
  if (!token || !secret || token.length !== 6) return false;

  const tokenNum = parseInt(token, 10);
  if (isNaN(tokenNum)) return false;

  // Check current period and ±1 window for clock skew tolerance
  for (const offset of [0, -1, 1]) {
    const expected = generateTOTP(secret, offset);
    // Constant-time comparison to prevent timing attacks
    if (timingSafeEqual(token, expected)) {
      return true;
    }
  }

  return false;
}

// Constant-time string comparison to prevent timing side-channel attacks
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  try {
    const { timingSafeEqual: tsEqual } = require("crypto");
    return tsEqual(bufA, bufB);
  } catch {
    // Fallback: still avoid short-circuit
    let result = 0;
    for (let i = 0; i < bufA.length; i++) {
      result |= bufA[i] ^ bufB[i];
    }
    return result === 0;
  }
}

export function verifyBackupCode(
  code: string,
  storedCodes: string[]
): { valid: boolean; index: number } {
  if (!code || !storedCodes) return { valid: false, index: -1 };

  const normalized = code.replace(/[-\s]/g, "").toUpperCase();

  for (let i = 0; i < storedCodes.length; i++) {
    const stored = (storedCodes[i] || "").replace(/[-\s]/g, "").toUpperCase();
    if (stored !== "USED" && stored === normalized) {
      storedCodes[i] = "USED";
      return { valid: true, index: i };
    }
  }

  return { valid: false, index: -1 };
}

export function isMFAEnabled(
  mfaEnabled: boolean | null,
  mfaSecret: string | null
): boolean {
  return mfaEnabled === true && !!mfaSecret;
}

export const MFASetupSchema = z.object({
  enabled: z.boolean(),
  code: z.string().length(6).optional(),
  backupCode: z.string().min(8).max(9).optional(), // L-5 FIX: backup codes are 9 chars with dash
});

export const MFAVerifySchema = z.object({
  code: z.string().min(6).max(9), // L-5 FIX: accept both TOTP (6) and backup (9)
  method: z.enum(["totp", "backup"]),
});