import { describe, it, expect } from "vitest";
import { PublicApiUseCases } from "../src/core/usecases/public-api.usecases";
import { ApiKeyDomain } from "../src/core/domain/public-api.domain";
import { IApiKeyRepositoryPort, IPublicApiEventPublisherPort } from "../src/core/ports/public-api.ports";

describe("Public API Service — Hexagonal Architecture 5.0", () => {
  it("creates, securely hashes and validates public API keys with scope enforcement", async () => {
    const store = new Map<string, ApiKeyDomain>();
    const published: any[] = [];

    const mockRepo: IApiKeyRepositoryPort = {
      save: async (k) => { store.set(k.keyHash, k); return k; },
      findByHash: async (h) => store.get(h) || null,
    };

    const mockPub: IPublicApiEventPublisherPort = {
      publishEvent: async (topic, event) => { published.push({ topic, event }); },
    };

    const useCases = new PublicApiUseCases(mockRepo, mockPub);

    const { apiKey, entity } = await useCases.createApiKey({
      companyId: "comp-api-1",
      name: "Zapier Key",
      scopes: ["leads.write", "orders.read"],
    });

    expect(apiKey.startsWith("agk_")).toBe(true);
    expect(entity.keyHash).toBeDefined();
    expect(published.some(e => e.topic === "public_api.key.created")).toBe(true);

    const validKey = await useCases.validateApiKey(apiKey, "leads.write");
    expect(validKey).toBeDefined();

    const unauthorizedScope = await useCases.validateApiKey(apiKey, "admin.delete");
    expect(unauthorizedScope).toBeNull();
  });
});
