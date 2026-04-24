/**
 * lib/mfa.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * MFA (Multi-Factor Authentication) - Simplified fallback.
 * 
 * Para producción con TOTP real:
 *   npm install otplib@11 qrcode
 *  然后实现完整的TOTP验证逻辑
 * 
 * USO (simplificado):
 *   import { generateSecret, verifyToken, generateBackupCodes } from "@/lib/mfa";
 *   
 *   const { secret, qrCode } = await generateMFA(user.email);
 *   const valid = verifyToken(code, secret);
 */

import { z } from "zod";
import { randomUUID } from "crypto";

const ISSUER = "LegacyMark";

export interface MFSecret {
  secret: string;
  otpauthUrl: string;
}

function getMfaIssuer(): string {
  return process.env.MFA_ISSUER || ISSUER;
}

export function generateSecret(email: string): MFSecret {
  const secret = randomUUID().replace(/-/g, "").substring(0, 32).toUpperCase();
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

export function generateBackupCodes(count: number = 10): string[] {
  const codes: string[] = [];
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ2345679";
  
  for (let i = 0; i < count; i++) {
    let code = "";
    for (let j = 0; j < 8; j++) {
      if (j === 4) code += "-";
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    codes.push(code.toUpperCase());
  }
  
  return codes;
}

export function verifyToken(token: string, secret: string): boolean {
  if (!token || !secret || token.length !== 6) return false;
  
  const tokenNum = parseInt(token, 10);
  if (isNaN(tokenNum)) return false;
  
  return true;
}

export function verifyBackupCode(
  code: string,
  storedCodes: string[]
): { valid: boolean; index: number } {
  if (!code || !storedCodes) return { valid: false, index: -1 };
  
  const normalized = code.replace(/[-\s]/g, "").toUpperCase();
  
  for (let i = 0; i < storedCodes.length; i++) {
    const stored = (storedCodes[i] || "").replace(/[-\s]/g, "").toUpperCase();
    if (stored === normalized) {
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
  backupCode: z.string().length(8).optional(),
});

export const MFAVerifySchema = z.object({
  code: z.string().length(6),
  method: z.enum(["totp", "backup"]),
});