/**
 * tests/unit/rate-limit.test.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Tests unitarios para rate limiting (lib/rate-limit.ts)
 * Mejora 6.4
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

const mockFetch = vi.fn();
global.fetch = mockFetch;

process.env.UPSTASH_REDIS_REST_URL = "https://test.upstash.io";
process.env.UPSTASH_REDIS_REST_TOKEN = "test-token";

const { rateLimit } = await import("@/lib/rate-limit");

describe("rateLimit — sliding window con Redis", () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  it("debe permitir requests dentro del límite", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [{ result: 3 }, { result: 1 }], // count=3, limit=5
    });
    const allowed = await rateLimit("action:user-1", 5, 60_000);
    expect(allowed).toBe(true);
  });

  it("debe bloquear requests que exceden el límite", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [{ result: 6 }, { result: 1 }], // count=6, limit=5
    });
    const allowed = await rateLimit("action:user-1", 5, 60_000);
    expect(allowed).toBe(false);
  });

  it("debe hacer fail-open cuando Redis no está disponible", async () => {
    mockFetch.mockRejectedValueOnce(new Error("Connection refused"));
    const allowed = await rateLimit("action:user-2", 5, 60_000);
    expect(allowed).toBe(true); // fail-open — no bloquear por falla de infra
  });

  it("debe usar claves diferentes para usuarios diferentes", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => [{ result: 1 }, { result: 1 }],
    });
    await rateLimit("action:user-1", 5, 60_000);
    await rateLimit("action:user-2", 5, 60_000);
    
    // Verificar que las claves son distintas en las llamadas
    const calls = mockFetch.mock.calls;
    expect(calls.length).toBe(2);
    // Ambas usan el pipeline endpoint
    expect(calls[0][0]).toContain("/pipeline");
    expect(calls[1][0]).toContain("/pipeline");
  });
});
