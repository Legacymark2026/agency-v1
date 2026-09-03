/**
 * Vault Environment Loader Helper
 * ─────────────────────────────────────────────────────────────────────────────
 * Injects secrets from a Vault KV v2 path directly into process.env at runtime
 * without ever persisting plaintext secrets to disk or committing files.
 */
import { vaultClient, VaultClient } from "./vault-client";

export interface EnvLoaderOptions {
  vaultPath: string;
  client?: VaultClient;
  overrideExisting?: boolean;
}

/**
 * Reads secrets from the specified Vault path and assigns them to process.env.
 */
export async function loadVaultSecretsIntoEnv(
  vaultPath: string,
  options: { overrideExisting?: boolean; client?: VaultClient } = {}
): Promise<number> {
  const client = options.client || vaultClient;
  const override = options.overrideExisting ?? true;

  try {
    const secrets = await client.getSecret<Record<string, string>>(vaultPath);
    let count = 0;

    for (const [key, value] of Object.entries(secrets)) {
      const envKey = key.toUpperCase().replace(/[^A-Z0-9_]/g, "_");
      if (override || process.env[envKey] === undefined) {
        process.env[envKey] = String(value);
        count++;
      }
    }

    return count;
  } catch (err: any) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(`[VaultEnvLoader] CRITICAL: Failed to load secrets from '${vaultPath}' in production: ${err.message}`);
    }
    console.warn(`[VaultEnvLoader] Notice: Could not load secrets from '${vaultPath}' in non-production: ${err.message}`);
    return 0;
  }
}
