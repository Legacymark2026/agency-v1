import { describe, it, expect, vi, beforeEach } from "vitest";
import { VaultClient } from "./vault-client";

describe("Enterprise VaultClient Package", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("authenticates using token directly if provided", async () => {
    const client = new VaultClient({
      vaultAddr: "http://127.0.0.1:8200",
      token: "s.sample-test-token-12345",
    });

    const token = await client.authenticate();
    expect(token).toBe("s.sample-test-token-12345");
  });

  it("authenticates via AppRole when roleId and secretId are provided", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        auth: {
          client_token: "s.mock-approle-token",
          lease_duration: 3600,
        },
      }),
    });
    global.fetch = mockFetch;

    const client = new VaultClient({
      vaultAddr: "http://127.0.0.1:8200",
      roleId: "sample-role-id",
      secretId: "sample-secret-id",
    });

    const token = await client.authenticate();
    expect(token).toBe("s.mock-approle-token");
    expect(mockFetch).toHaveBeenCalledWith(
      "http://127.0.0.1:8200/v1/auth/approle/login",
      expect.objectContaining({
        method: "POST",
      })
    );
  });

  it("retrieves KV v2 secret and caches subsequent reads within TTL", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
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

    const client = new VaultClient({
      token: "s.test-token",
    });

    const secret1 = await client.getSecret<{ stripe_key: string }>("secret/data/legacymark/payment-service");
    expect(secret1.stripe_key).toBe("sk_test_123");
    expect(mockFetch).toHaveBeenCalledTimes(1);

    // Second call should hit the cache without calling fetch
    const secret2 = await client.getSecret<{ stripe_key: string }>("secret/data/legacymark/payment-service");
    expect(secret2.stripe_key).toBe("sk_test_123");
    expect(mockFetch).toHaveBeenCalledTimes(1);

    // Invalidation clears cache and forces fetch
    client.invalidateCache();
    await client.getSecret<{ stripe_key: string }>("secret/data/legacymark/payment-service");
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });
});
