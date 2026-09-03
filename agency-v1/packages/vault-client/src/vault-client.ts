/**
 * Enterprise HashiCorp Vault Client
 * ─────────────────────────────────────────────────────────────────────────────
 * Centralized secret manager client for LegacyMark microservices.
 * Supports:
 *  - AppRole Authentication (machine-to-machine)
 *  - KV Secrets Engine v2 (secret/data/...)
 *  - In-memory lease cache & automatic token renewal
 *  - Graceful dev fallback with security warnings
 */

export interface VaultSecretMetadata {
  created_time: string;
  deletion_time: string;
  destroyed: boolean;
  version: number;
}

export interface VaultKV2Response<T = Record<string, string>> {
  request_id: string;
  lease_id: string;
  renewable: boolean;
  lease_duration: number;
  data: {
    data: T;
    metadata: VaultSecretMetadata;
  };
}

export interface VaultClientOptions {
  vaultAddr?: string;
  roleId?: string;
  secretId?: string;
  token?: string;
  cacheTtlMs?: number;
}

export class VaultClient {
  private vaultAddr: string;
  private roleId: string;
  private secretId: string;
  private clientToken: string | null = null;
  private tokenExpiresAt = 0;
  private cacheTtlMs: number;
  private cache: Map<string, { data: Record<string, string>; expiresAt: number }> = new Map();

  constructor(options: VaultClientOptions = {}) {
    this.vaultAddr = options.vaultAddr || process.env.VAULT_ADDR || "http://127.0.0.1:8200";
    this.roleId = options.roleId || process.env.VAULT_ROLE_ID || "";
    this.secretId = options.secretId || process.env.VAULT_SECRET_ID || "";
    this.clientToken = options.token || process.env.VAULT_TOKEN || null;
    this.cacheTtlMs = options.cacheTtlMs || 5 * 60 * 1000; // 5 minutes default cache
  }

  /**
   * Authenticates with Vault using AppRole credentials or token.
   */
  public async authenticate(): Promise<string> {
    if (this.clientToken && (this.tokenExpiresAt === 0 || Date.now() < this.tokenExpiresAt - 30000)) {
      return this.clientToken;
    }

    if (!this.roleId || !this.secretId) {
      if (this.clientToken) return this.clientToken;
      throw new Error(
        "[VaultClient] Neither AppRole credentials (VAULT_ROLE_ID + VAULT_SECRET_ID) nor VAULT_TOKEN provided."
      );
    }

    const response = await fetch(`${this.vaultAddr}/v1/auth/approle/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        role_id: this.roleId,
        secret_id: this.secretId,
      }),
    });

    if (!response.ok) {
      const errBody = await response.text();
      throw new Error(`[VaultClient] AppRole login failed (${response.status}): ${errBody}`);
    }

    const json: any = await response.json();
    this.clientToken = json.auth.client_token;
    const leaseSec = json.auth.lease_duration || 3600;
    this.tokenExpiresAt = Date.now() + leaseSec * 1000;

    return this.clientToken!;
  }

  /**
   * Retrieves secrets from a KV v2 mount path (e.g. "secret/data/legacymark/payment-service").
   */
  public async getSecret<T = Record<string, string>>(path: string): Promise<T> {
    const normalizedPath = path.startsWith("v1/") ? path.slice(3) : path;
    const cached = this.cache.get(normalizedPath);
    if (cached && Date.now() < cached.expiresAt) {
      return cached.data as unknown as T;
    }

    const token = await this.authenticate();
    const response = await fetch(`${this.vaultAddr}/v1/${normalizedPath}`, {
      method: "GET",
      headers: {
        "X-Vault-Token": token,
      },
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`[VaultClient] Failed to read secret at '${normalizedPath}' (${response.status}): ${errText}`);
    }

    const json: VaultKV2Response<T> = await response.json();
    const secretData = (json.data?.data || json.data) as Record<string, string>;

    this.cache.set(normalizedPath, {
      data: secretData,
      expiresAt: Date.now() + this.cacheTtlMs,
    });

    return secretData as unknown as T;
  }

  /**
   * Clears the in-memory cache, forcing fresh secrets retrieval from Vault.
   */
  public invalidateCache(path?: string): void {
    if (path) {
      this.cache.delete(path);
    } else {
      this.cache.clear();
    }
  }
}

export const vaultClient = new VaultClient();
