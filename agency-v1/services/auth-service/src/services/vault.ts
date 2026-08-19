/**
 * services/auth-service/src/services/vault.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * HashiCorp Vault Client Helper
 * Retrieves production DB credentials and JWT secrets securely at runtime.
 */

export class VaultService {
  private static vaultUrl = process.env.VAULT_ADDR || "http://127.0.0.1:8200";
  private static vaultToken = process.env.VAULT_TOKEN || "";

  /**
   * Retrieves a secret path from HashiCorp Vault key-value engine (v2)
   * @param path KV secret path (e.g., 'secret/data/auth')
   */
  public static async getSecret<T = any>(path: string): Promise<T | null> {
    if (!this.vaultToken) {
      console.warn(`[Vault] No VAULT_TOKEN provided. Falling back to local configuration.`);
      return null;
    }

    try {
      const response = await fetch(`${this.vaultUrl}/v1/${path}`, {
        headers: {
          "X-Vault-Token": this.vaultToken,
        },
      });

      if (!response.ok) {
        throw new Error(`Vault returned HTTP ${response.status}`);
      }

      const body = await response.json() as any;
      console.log(`🔑 [Vault] Secrets loaded successfully from path: ${path}`);
      return body.data.data as T;
    } catch (err: any) {
      console.error(`❌ [Vault] Failed to retrieve secret from path ${path}:`, err.message);
      return null;
    }
  }
}
