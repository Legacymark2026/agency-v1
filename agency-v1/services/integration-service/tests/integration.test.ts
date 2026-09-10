import { describe, it, expect } from "vitest";
import { IntegrationUseCases } from "../src/core/usecases/integration.usecases";
import { signWebhookPayload, verifyWebhookSignature, IntegrationDomain } from "../src/core/domain/integration.domain";
import { IIntegrationRepositoryPort, IWebhookDeliveryPort, IIntegrationEventPublisherPort } from "../src/core/ports/integration.ports";

describe("Integration Service — Hexagonal Architecture 5.0", () => {
  it("signs and verifies webhook cryptographic signatures", () => {
    const payload = JSON.stringify({ event: "order.paid", total: 50000 });
    const secret = "super-secret-key-123";
    const signature = signWebhookPayload(payload, secret);

    expect(signature).toBeDefined();
    expect(signature.length).toBe(64); // SHA-256 hex
    expect(verifyWebhookSignature(payload, secret, signature)).toBe(true);
    expect(verifyWebhookSignature(payload, "tampered-secret", signature)).toBe(false);
  });

  it("orchestrates provider onboarding and HMAC signed dispatching", async () => {
    const store = new Map<string, IntegrationDomain>();
    const mockRepo: IIntegrationRepositoryPort = {
      save: async (i) => { store.set(i.id, i); return i; },
      findById: async (id) => store.get(id) || null,
      findByCompanyAndProvider: async () => null,
    };
    const mockDelivery: IWebhookDeliveryPort = {
      sendPost: async () => true,
    };
    const mockPub: IIntegrationEventPublisherPort = {
      publishEvent: async () => {},
    };

    const useCases = new IntegrationUseCases(mockRepo, mockDelivery, mockPub);
    const int = await useCases.connectProvider({ companyId: "c-1", provider: "ZAPIER" });
    expect(int.provider).toBe("ZAPIER");
    expect(int.apiKey).toBeDefined();

    const delivered = await useCases.dispatchWebhook(int.id, "lead.captured", { name: "Juan" });
    expect(delivered).toBe(true);
  });
});
