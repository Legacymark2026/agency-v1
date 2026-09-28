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
export declare class VaultClient {
    private vaultAddr;
    private roleId;
    private secretId;
    private clientToken;
    private tokenExpiresAt;
    private cacheTtlMs;
    private cache;
    constructor(options?: VaultClientOptions);
    /**
     * Authenticates with Vault using AppRole credentials or token.
     */
    authenticate(): Promise<string>;
    /**
     * Retrieves secrets from a KV v2 mount path (e.g. "secret/data/legacymark/payment-service").
     */
    getSecret<T = Record<string, string>>(path: string): Promise<T>;
    /**
     * Clears the in-memory cache, forcing fresh secrets retrieval from Vault.
     */
    invalidateCache(path?: string): void;
}
export declare const vaultClient: VaultClient;
//# sourceMappingURL=vault-client.d.ts.map