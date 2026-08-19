/**
 * services/auth-service/src/services/vault.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * HashiCorp Vault Client Helper
 * Retrieves production DB credentials and JWT secrets securely at runtime.
 */
export declare class VaultService {
    private static vaultUrl;
    private static vaultToken;
    /**
     * Retrieves a secret path from HashiCorp Vault key-value engine (v2)
     * @param path KV secret path (e.g., 'secret/data/auth')
     */
    static getSecret<T = any>(path: string): Promise<T | null>;
}
