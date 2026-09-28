/**
 * Vault Environment Loader Helper
 * ─────────────────────────────────────────────────────────────────────────────
 * Injects secrets from a Vault KV v2 path directly into process.env at runtime
 * without ever persisting plaintext secrets to disk or committing files.
 */
import { VaultClient } from "./vault-client";
export interface EnvLoaderOptions {
    vaultPath: string;
    client?: VaultClient;
    overrideExisting?: boolean;
}
/**
 * Reads secrets from the specified Vault path and assigns them to process.env.
 */
export declare function loadVaultSecretsIntoEnv(vaultPath: string, options?: {
    overrideExisting?: boolean;
    client?: VaultClient;
}): Promise<number>;
//# sourceMappingURL=env-loader.d.ts.map