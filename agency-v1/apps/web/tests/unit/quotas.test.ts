/**
 * tests/unit/quotas.test.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Tests unitarios para el sistema de cuotas SaaS (lib/quotas.ts)
 * Mejora 6.4
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock fetch global para simular Upstash Redis
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock env vars
process.env.UPSTASH_REDIS_REST_URL = "https://test.upstash.io";
process.env.UPSTASH_REDIS_REST_TOKEN = "test-token";
process.env.MASTER_TENANT_ID = "master-tenant-id";

// Re-import after setting env vars
const { enforceQuota, getQuotaUsage, TIER_LIMITS } = await import("@/lib/quotas");

// ── Setup ─────────────────────────────────────────────────────────────────────
beforeEach(() => {
  mockFetch.mockClear();
});

describe("TIER_LIMITS", () => {
  it("debe tener todos los tiers definidos", () => {
    expect(TIER_LIMITS).toHaveProperty("free");
    expect(TIER_LIMITS).toHaveProperty("pro");
    expect(TIER_LIMITS).toHaveProperty("agency");
  });

  it("free tier debe ser más restrictivo que pro", () => {
    expect(TIER_LIMITS.free.leads).toBeLessThan(TIER_LIMITS.pro.leads);
    expect(TIER_LIMITS.free.ai_interactions).toBeLessThan(TIER_LIMITS.pro.ai_interactions);
  });

  it("agency tier debe ser el más permisivo", () => {
    expect(TIER_LIMITS.agency.leads).toBeGreaterThan(TIER_LIMITS.pro.leads);
  });
});

describe("enforceQuota — MASTER_TENANT bypass", () => {
  it("debe permitir acceso ilimitado al master tenant sin llamar a Redis", async () => {
    mockFetch.mockClear();
    const result = await enforceQuota("master-tenant-id", "leads", "free");
    expect(result.allowed).toBe(true);
    expect(result.limit).toBe(999999);
    expect(mockFetch).not.toHaveBeenCalled(); // No debe llamar a Redis
  });
});

describe("enforceQuota — free tier", () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  it("debe permitir cuando el uso está dentro del límite", async () => {
    // Simular Redis devolviendo uso = 50 (dentro del límite free de 100)
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [{ result: 50 }, { result: 1 }], // INCR=50, EXPIRE=1
    });

    const result = await enforceQuota("company-1", "leads", "free");
    expect(result.allowed).toBe(true);
    expect(result.limit).toBe(TIER_LIMITS.free.leads);
    expect(result.remaining).toBe(TIER_LIMITS.free.leads - 50);
  });

  it("debe bloquear cuando el uso excede el límite free", async () => {
    // Simular Redis devolviendo uso = 101 (supera el límite free de 100)
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [{ result: 101 }, { result: 1 }],
    });
    // Segunda llamada: DECR rollback (fire-and-forget)
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => [{ result: 100 }] });

    const result = await enforceQuota("company-1", "leads", "free");
    expect(result.allowed).toBe(false);
  });

  it("debe hacer fail-open si Redis falla", async () => {
    mockFetch.mockRejectedValueOnce(new Error("Network error"));
    const result = await enforceQuota("company-1", "leads", "free");
    expect(result.allowed).toBe(true); // fail-open
  });
});

describe("enforceQuota — pro tier", () => {
  it("debe usar límites del tier pro", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [{ result: 1000 }, { result: 1 }],
    });
    const result = await enforceQuota("company-2", "leads", "pro");
    expect(result.allowed).toBe(true);
    expect(result.limit).toBe(TIER_LIMITS.pro.leads); // 5000
  });
});

describe("getQuotaUsage", () => {
  it("debe devolver uso actual con limit y tier correctos", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ result: "250" }),
    });

    const result = await getQuotaUsage("company-3", "leads", "pro");
    expect(result).not.toBeNull();
    expect(result?.usage).toBe(250);
    expect(result?.limit).toBe(TIER_LIMITS.pro.leads);
    expect(result?.tier).toBe("pro");
  });

  it("debe devolver 0 de uso si no hay datos en Redis", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ result: null }),
    });
    const result = await getQuotaUsage("company-4", "emails_per_month", "free");
    expect(result?.usage).toBe(0);
    expect(result?.limit).toBe(TIER_LIMITS.free.emails_per_month);
  });
});
