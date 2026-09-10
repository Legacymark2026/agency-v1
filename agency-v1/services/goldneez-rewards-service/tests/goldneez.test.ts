import { describe, it, expect } from "vitest";
import { GoldneezUseCases } from "../src/core/usecases/goldneez.usecases";
import { evaluateTier, RewardWalletDomain } from "../src/core/domain/goldneez.domain";
import { IRewardRepositoryPort, IRewardEventPublisherPort } from "../src/core/ports/goldneez.ports";

describe("Goldneez Rewards Service — Hexagonal Architecture 5.0", () => {
  it("evaluates loyalty tiers according to accumulated points", () => {
    expect(evaluateTier(1000)).toBe("BRONZE");
    expect(evaluateTier(6000)).toBe("SILVER");
    expect(evaluateTier(25000)).toBe("GOLD");
    expect(evaluateTier(70000)).toBe("DIAMOND");
  });

  it("orchestrates point crediting, tier upgrades and redemptions", async () => {
    const store = new Map<string, RewardWalletDomain>();
    const published: any[] = [];

    const mockRepo: IRewardRepositoryPort = {
      save: async (w) => { store.set(w.userId, w); return w; },
      findByUserId: async (uid) => store.get(uid) || null,
    };

    const mockPub: IRewardEventPublisherPort = {
      publishEvent: async (topic, event) => { published.push({ topic, event }); },
    };

    const useCases = new GoldneezUseCases(mockRepo, mockPub);

    const initial = await useCases.getWallet("user-loyalty-1");
    expect(initial.tier).toBe("BRONZE");

    const upgraded = await useCases.creditPoints("user-loyalty-1", 25000, "Compra anual");
    expect(upgraded.tier).toBe("GOLD");
    expect(upgraded.points).toBe(25000);
    expect(published.some(e => e.topic === "goldneez.points.credited")).toBe(true);

    const redeemed = await useCases.redeemPoints("user-loyalty-1", 5000);
    expect(redeemed.points).toBe(20000);
    expect(published.some(e => e.topic === "goldneez.points.redeemed")).toBe(true);
  });
});
