import { describe, it, expect } from "vitest";
import { AdminUseCases } from "../src/core/usecases/admin.usecases";
import { TenantDomain } from "../src/core/domain/admin.domain";
import { ITenantRepositoryPort, IAdminEventPublisherPort } from "../src/core/ports/admin.ports";

describe("Admin Service — Hexagonal Architecture 5.0", () => {
  it("provisions tenant and manages subscription tier upgrades with decoupled adapters", async () => {
    const store = new Map<string, TenantDomain>();
    const published: any[] = [];

    const mockRepo: ITenantRepositoryPort = {
      save: async (t) => { store.set(t.id, t); return t; },
      findById: async (id) => store.get(id) || null,
      findAll: async () => Array.from(store.values()),
    };

    const mockPub: IAdminEventPublisherPort = {
      publishEvent: async (topic, event) => { published.push({ topic, event }); },
    };

    const useCases = new AdminUseCases(mockRepo, mockPub);

    const tenant = await useCases.provisionTenant({
      name: "Grupo Bancario",
      domain: "bancario.agency.com",
      tier: "STARTER",
    });

    expect(tenant.id).toBeDefined();
    expect(tenant.tier).toBe("STARTER");
    expect(published.some(e => e.topic === "admin.tenant.provisioned")).toBe(true);

    const upgraded = await useCases.upgradeTenant(tenant.id, "ENTERPRISE");
    expect(upgraded.tier).toBe("ENTERPRISE");
    expect(published.some(e => e.topic === "admin.tenant.upgraded")).toBe(true);
  });
});
