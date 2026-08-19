"use strict";
/**
 * services/auth-service/src/services/vault.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * HashiCorp Vault Client Helper
 * Retrieves production DB credentials and JWT secrets securely at runtime.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.VaultService = void 0;
class VaultService {
    static vaultUrl = process.env.VAULT_ADDR || "http://127.0.0.1:8200";
    static vaultToken = process.env.VAULT_TOKEN || "";
    /**
     * Retrieves a secret path from HashiCorp Vault key-value engine (v2)
     * @param path KV secret path (e.g., 'secret/data/auth')
     */
    static async getSecret(path) {
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
            const body = await response.json();
            console.log(`🔑 [Vault] Secrets loaded successfully from path: ${path}`);
            return body.data.data;
        }
        catch (err) {
            console.error(`❌ [Vault] Failed to retrieve secret from path ${path}:`, err.message);
            return null;
        }
    }
}
exports.VaultService = VaultService;
//# sourceMappingURL=vault.js.map