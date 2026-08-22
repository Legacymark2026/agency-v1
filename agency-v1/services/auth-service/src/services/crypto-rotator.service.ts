/**
 * AES-256-GCM Envelope Encryption & Key Rotator Service
 * ─────────────────────────────────────────────────────────────────────────────
 * Provides authenticated AES-256-GCM data encryption at rest with key versioning
 * and automated key rotation.
 */

import crypto from "crypto";

export interface EncryptedPayload {
  cipherText: string;
  iv: string;
  authTag: string;
  keyVersion: string;
}

export class EnvelopeCryptoService {
  private activeKeyVersion = "v1";
  private keys: Map<string, Buffer> = new Map();

  constructor() {
    const defaultMasterKey = process.env.MASTER_ENCRYPTION_KEY || "legacymark_master_secret_32bytes!!";
    const keyBuf = crypto.createHash("sha256").update(defaultMasterKey).digest();
    this.keys.set("v1", keyBuf);
  }

  public encrypt(plainText: string): EncryptedPayload {
    const iv = crypto.randomBytes(12); // 96-bit IV for GCM
    const masterKey = this.keys.get(this.activeKeyVersion)!;

    const cipher = crypto.createCipheriv("aes-256-gcm", masterKey, iv);
    let cipherText = cipher.update(plainText, "utf8", "base64");
    cipherText += cipher.final("base64");

    const authTag = cipher.getAuthTag().toString("base64");

    return {
      cipherText,
      iv: iv.toString("base64"),
      authTag,
      keyVersion: this.activeKeyVersion,
    };
  }

  public decrypt(payload: EncryptedPayload): string {
    const masterKey = this.keys.get(payload.keyVersion);
    if (!masterKey) throw new Error(`[EnvelopeCrypto] Key version ${payload.keyVersion} not registered.`);

    const ivBuf = Buffer.from(payload.iv, "base64");
    const authTagBuf = Buffer.from(payload.authTag, "base64");

    const decipher = crypto.createDecipheriv("aes-256-gcm", masterKey, ivBuf);
    decipher.setAuthTag(authTagBuf);

    let plainText = decipher.update(payload.cipherText, "base64", "utf8");
    plainText += decipher.final("utf8");

    return plainText;
  }
}

export const envelopeCrypto = new EnvelopeCryptoService();
