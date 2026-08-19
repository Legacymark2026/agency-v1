/**
 * services/auth-service/src/utilities/crypto.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * AES-256-GCM Field-Level Encryption Helper using config.
 */

import crypto from "crypto";
import { envConfig } from "@config/env.config";

const ALGORITHM = "aes-256-gcm";
const ENCRYPTION_KEY = crypto
  .createHash("sha256")
  .update(envConfig.dbEncryptionKey)
  .digest();

export function encrypt(text: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
  
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  
  const tag = cipher.getAuthTag().toString("hex");
  
  return `${iv.toString("hex")}:${tag}:${encrypted}`;
}

export function decrypt(encryptedText: string): string {
  try {
    const parts = encryptedText.split(":");
    if (parts.length !== 3) {
      return encryptedText;
    }
    
    const iv = Buffer.from(parts[0], "hex");
    const tag = Buffer.from(parts[1], "hex");
    const encrypted = Buffer.from(parts[2], "hex");
    
    const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
    decipher.setAuthTag(tag);
    
    let decrypted = decipher.update(encrypted, undefined, "utf8");
    decrypted += decipher.final("utf8");
    
    return decrypted;
  } catch (err) {
    return encryptedText;
  }
}
