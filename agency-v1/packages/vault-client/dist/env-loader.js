"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadVaultSecretsIntoEnv = loadVaultSecretsIntoEnv;
/**
 * Vault Environment Loader Helper
 * ─────────────────────────────────────────────────────────────────────────────
 * Injects secrets from a Vault KV v2 path directly into process.env at runtime
 * without ever persisting plaintext secrets to disk or committing files.
 */
const vault_client_1 = require("./vault-client");
/**
 * Reads secrets from the specified Vault path and assigns them to process.env.
 */
async function loadVaultSecretsIntoEnv(vaultPath, options = {}) {
    const client = options.client || vault_client_1.vaultClient;
    const override = options.overrideExisting ?? true;
    try {
        const secrets = await client.getSecret(vaultPath);
        let count = 0;
        for (const [key, value] of Object.entries(secrets)) {
            const envKey = key.toUpperCase().replace(/[^A-Z0-9_]/g, "_");
            if (override || process.env[envKey] === undefined) {
                process.env[envKey] = String(value);
                count++;
            }
        }
        return count;
    }
    catch (err) {
        if (process.env.NODE_ENV === "production") {
            throw new Error(`[VaultEnvLoader] CRITICAL: Failed to load secrets from '${vaultPath}' in production: ${err.message}`);
        }
        console.warn(`[VaultEnvLoader] Notice: Could not load secrets from '${vaultPath}' in non-production: ${err.message}`);
        return 0;
    }
}
//# sourceMappingURL=env-loader.js.map