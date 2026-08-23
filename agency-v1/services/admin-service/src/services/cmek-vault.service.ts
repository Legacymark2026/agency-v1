/**
 * Multi-Tenant CMEK (Customer-Managed Encryption Keys) & Data Vault Service
 * ─────────────────────────────────────────────────────────────────────────────
 * Enables enterprise tenants to manage their own encryption keys for strict
 * logical and cryptographic data isolation complying with SOC2 and HIPAA standards.
 */

import crypto from "crypto";

export interface TenantKeyConfig {
  tenantId: string;
  keyAlias: string;
  masterKeyHash: string;
  keyStatus: "ACTIVE" | "ROTATED" | "REVOKED";
  algorithm: "AES-256-GCM";
  createdAt: string;
  lastRotatedAt: string;
}

export interface EncryptedVaultPayload {
  tenantId: string;
  encryptedData: string;
  iv: string;
  authTag: string;
  keyVersion: number;
}

export class CMEKVaultService {
  private tenantKeys = new Map<string, { key: Buffer; config: TenantKeyConfig; version: number }>();

  /**
   * Registers or provisions a dedicated Customer-Managed Encryption Key.
   */
  public provisionTenantKey(tenantId: string, keyAlias: string): TenantKeyConfig {
    const rawKey = crypto.randomBytes(32); // 256 bits
    const masterKeyHash = crypto.createHash("sha256").update(rawKey).digest("hex");

    const config: TenantKeyConfig = {
      tenantId,
      keyAlias,
      masterKeyHash,
      keyStatus: "ACTIVE",
      algorithm: "AES-256-GCM",
      createdAt: new Date().toISOString(),
      lastRotatedAt: new Date().toISOString(),
    };

    this.tenantKeys.set(tenantId, { key: rawKey, config, version: 1 });
    return config;
  }

  /**
   * Encrypts sensitive tenant data using tenant's isolated CMEK.
   */
  public encryptForTenant(tenantId: string, plaintext: string): EncryptedVaultPayload {
    let keyEntry = this.tenantKeys.get(tenantId);
    if (!keyEntry || keyEntry.config.keyStatus !== "ACTIVE") {
      this.provisionTenantKey(tenantId, `default_cmek_${tenantId}`);
      keyEntry = this.tenantKeys.get(tenantId)!;
    }

    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv("aes-256-gcm", keyEntry.key, iv);

    let encrypted = cipher.update(plaintext, "utf8", "hex");
    encrypted += cipher.final("hex");
    const authTag = cipher.getAuthTag().toString("hex");

    return {
      tenantId,
      encryptedData: encrypted,
      iv: iv.toString("hex"),
      authTag,
      keyVersion: keyEntry.version,
    };
  }

  /**
   * Decrypts tenant data verifying cryptographic authenticity.
   */
  public decryptForTenant(payload: EncryptedVaultPayload): string {
    const keyEntry = this.tenantKeys.get(payload.tenantId);
    if (!keyEntry) throw new Error(`Clave CMEK no encontrada para inquilino ${payload.tenantId}`);

    const decipher = crypto.createDecipheriv(
      "aes-256-gcm",
      keyEntry.key,
      Buffer.from(payload.iv, "hex")
    );
    decipher.setAuthTag(Buffer.from(payload.authTag, "hex"));

    let decrypted = decipher.update(payload.encryptedData, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  }

  /**
   * Rotates the tenant's CMEK key on demand.
   */
  public rotateTenantKey(tenantId: string): TenantKeyConfig {
    const existing = this.tenantKeys.get(tenantId);
    if (!existing) throw new Error(`Inquilino ${tenantId} no tiene clave registrada.`);

    const newRawKey = crypto.randomBytes(32);
    const newHash = crypto.createHash("sha256").update(newRawKey).digest("hex");

    existing.key = newRawKey;
    existing.version += 1;
    existing.config.masterKeyHash = newHash;
    existing.config.lastRotatedAt = new Date().toISOString();

    return existing.config;
  }
}

export const cmekVaultService = new CMEKVaultService();
