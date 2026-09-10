import { describe, it, expect } from "vitest";
import { AffiliateUseCases } from "../src/core/usecases/affiliate.usecases";
import { calculateAffiliateCommission, AffiliateDomain } from "../src/core/domain/affiliate.domain";
import { IAffiliateRepositoryPort, IAffiliateEventPublisherPort } from "../src/core/ports/affiliate.ports";

describe("Affiliate Service — Hexagonal Architecture 5.0", () => {
  it("calculates commission accurately according to affiliate tier", () => {
    expect(calculateAffiliateCommission(1000000, 20)).toBe(200000);
    expect(calculateAffiliateCommission(500000, 15)).toBe(75000);
  });

  it("orchestrates affiliate registration and sale crediting", async () => {
    const store = new Map<string, AffiliateDomain>();
    const published: any[] = [];

    const mockRepo: IAffiliateRepositoryPort = {
      save: async (a) => { store.set(a.id, a); return a; },
      findByCode: async (code) => Array.from(store.values()).find(a => a.referralCode === code) || null,
      findById: async (id) => store.get(id) || null,
    };

    const mockPub: IAffiliateEventPublisherPort = {
      publishEvent: async (topic, event) => { published.push({ topic, event }); },
    };

    const useCases = new AffiliateUseCases(mockRepo, mockPub);

    const aff = await useCases.registerAffiliate({
      userId: "usr-partner-1",
      referralCode: "AGENCY2026",
      ratePct: 20,
    });

    expect(aff.id).toBeDefined();
    expect(aff.referralCode).toBe("AGENCY2026");

    const credited = await useCases.creditCommission("AGENCY2026", 1000000);
    expect(credited.totalEarnings).toBe(200000);
    expect(credited.pendingPayout).toBe(200000);
    expect(published.some(e => e.topic === "affiliate.commission.credited")).toBe(true);
  });
});
