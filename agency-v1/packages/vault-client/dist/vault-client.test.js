"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const vault_client_1 = require("./vault-client");
(0, vitest_1.describe)("Enterprise VaultClient Package", () => {
    (0, vitest_1.beforeEach)(() => {
        vitest_1.vi.restoreAllMocks();
    });
    (0, vitest_1.it)("authenticates using token directly if provided", async () => {
        const client = new vault_client_1.VaultClient({
            vaultAddr: "http://127.0.0.1:8200",
            token: "s.sample-test-token-12345",
        });
        const token = await client.authenticate();
        (0, vitest_1.expect)(token).toBe("s.sample-test-token-12345");
    });
    (0, vitest_1.it)("authenticates via AppRole when roleId and secretId are provided", async () => {
        const mockFetch = vitest_1.vi.fn().mockResolvedValue({
            ok: true,
            json: async () => ({
                auth: {
                    client_token: "s.mock-approle-token",
                    lease_duration: 3600,
                },
            }),
        });
        global.fetch = mockFetch;
        const client = new vault_client_1.VaultClient({
            vaultAddr: "http://127.0.0.1:8200",
            roleId: "sample-role-id",
            secretId: "sample-secret-id",
        });
        const token = await client.authenticate();
        (0, vitest_1.expect)(token).toBe("s.mock-approle-token");
        (0, vitest_1.expect)(mockFetch).toHaveBeenCalledWith("http://127.0.0.1:8200/v1/auth/approle/login", vitest_1.expect.objectContaining({
            method: "POST",
        }));
    });
    (0, vitest_1.it)("retrieves KV v2 secret and caches subsequent reads within TTL", async () => {
        const mockFetch = vitest_1.vi.fn().mockResolvedValue({
            ok: true,
            json: async () => ({
                data: {
                    data: {
                        stripe_key: "sk_test_123",
                        wompi_secret: "secret_456",
                    },
                    metadata: { version: 1 },
                },
            }),
        });
        global.fetch = mockFetch;
        const client = new vault_client_1.VaultClient({
            token: "s.test-token",
        });
        const secret1 = await client.getSecret("secret/data/legacymark/payment-service");
        (0, vitest_1.expect)(secret1.stripe_key).toBe("sk_test_123");
        (0, vitest_1.expect)(mockFetch).toHaveBeenCalledTimes(1);
        // Second call should hit the cache without calling fetch
        const secret2 = await client.getSecret("secret/data/legacymark/payment-service");
        (0, vitest_1.expect)(secret2.stripe_key).toBe("sk_test_123");
        (0, vitest_1.expect)(mockFetch).toHaveBeenCalledTimes(1);
        // Invalidation clears cache and forces fetch
        client.invalidateCache();
        await client.getSecret("secret/data/legacymark/payment-service");
        (0, vitest_1.expect)(mockFetch).toHaveBeenCalledTimes(2);
    });
});
//# sourceMappingURL=vault-client.test.js.map