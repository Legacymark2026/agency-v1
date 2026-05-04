/**
 * tests/integration/billing-webhook.test.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Tests de integración para el webhook de Stripe (app/api/webhooks/stripe/route.ts)
 * Mejora 6.4
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import type { NextRequest } from "next/server";

// ── Mock Stripe ───────────────────────────────────────────────────────────────
const mockConstructEvent = vi.fn();
const mockStripe = {
  webhooks: {
    constructEvent: mockConstructEvent,
  },
};

vi.mock("@/lib/stripe", () => ({ stripe: mockStripe }));

// ── Mock Prisma ───────────────────────────────────────────────────────────────
const mockUpdate = vi.fn().mockResolvedValue({ count: 1 });
const mockUpdateMany = vi.fn().mockResolvedValue({ count: 1 });
const mockFindFirst = vi.fn().mockResolvedValue(null);
const mockFindUnique = vi.fn().mockResolvedValue(null);

vi.mock("@/lib/prisma", () => ({
  prisma: {
    company: {
      update: mockUpdate,
      updateMany: mockUpdateMany,
      findFirst: mockFindFirst,
      findUnique: mockFindUnique,
    },
  },
}));

// ── Mock Redis (idempotency) ───────────────────────────────────────────────────
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Simular que el evento no ha sido procesado (SET NX devuelve "OK")
function mockRedisAccept() {
  mockFetch.mockResolvedValueOnce({
    ok: true,
    json: async () => [{ result: "OK" }], // Nuevo evento
  });
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function makeRequest(body: string, signature = "test-sig"): NextRequest {
  return {
    text: async () => body,
    headers: {
      get: (key: string) => key === "stripe-signature" ? signature : null,
    },
    nextUrl: new URL("http://localhost/api/webhooks/stripe"),
  } as unknown as NextRequest;
}

// ── Tests ─────────────────────────────────────────────────────────────────────
describe("Stripe Webhook — checkout.session.completed", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_test";
    process.env.UPSTASH_REDIS_REST_URL = "https://test.upstash.io";
    process.env.UPSTASH_REDIS_REST_TOKEN = "test-token";
  });

  it("debe upgradar el tier de la empresa tras checkout exitoso", async () => {
    const event = {
      id: "evt_1",
      type: "checkout.session.completed",
      data: {
        object: {
          mode: "subscription",
          client_reference_id: "company-abc",
          subscription: "sub_123",
          metadata: { tierName: "pro" },
        },
      },
    };

    mockConstructEvent.mockReturnValue(event);
    mockRedisAccept();

    const { POST } = await import("@/app/api/webhooks/stripe/route");
    const req = makeRequest(JSON.stringify(event));
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.received).toBe(true);
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "company-abc" },
        data: expect.objectContaining({
          subscriptionTier: "pro",
          subscriptionStatus: "active",
        }),
      })
    );
  });
});

describe("Stripe Webhook — customer.subscription.deleted", () => {
  it("debe downgrader a free cuando se cancela la suscripción", async () => {
    const event = {
      id: "evt_2",
      type: "customer.subscription.deleted",
      data: {
        object: { id: "sub_456" },
      },
    };

    mockConstructEvent.mockReturnValue(event);
    mockRedisAccept();

    const { POST } = await import("@/app/api/webhooks/stripe/route");
    const req = makeRequest(JSON.stringify(event));
    await POST(req);

    expect(mockUpdateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { stripeSubscriptionId: "sub_456" },
        data: expect.objectContaining({
          subscriptionStatus: "canceled",
          subscriptionTier: "free",
        }),
      })
    );
  });
});

describe("Stripe Webhook — verificación de firma", () => {
  it("debe rechazar requests sin signature header", async () => {
    const { POST } = await import("@/app/api/webhooks/stripe/route");
    const req = {
      text: async () => "{}",
      headers: { get: () => null },
    } as unknown as NextRequest;

    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("debe rechazar requests con firma inválida", async () => {
    mockConstructEvent.mockImplementation(() => {
      throw new Error("Invalid signature");
    });

    const { POST } = await import("@/app/api/webhooks/stripe/route");
    const req = makeRequest("{}", "bad-signature");
    const res = await POST(req);
    expect(res.status).toBe(400);
  });
});

describe("Stripe Webhook — idempotencia", () => {
  it("debe ignorar eventos duplicados (ya procesados en Redis)", async () => {
    const event = {
      id: "evt_duplicate",
      type: "checkout.session.completed",
      data: { object: { mode: "subscription", client_reference_id: "company-xyz" } },
    };
    mockConstructEvent.mockReturnValue(event);

    // Simular que el evento YA fue procesado (SET NX devuelve null)
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [{ result: null }], // null = clave ya existía
    });

    const { POST } = await import("@/app/api/webhooks/stripe/route");
    const req = makeRequest(JSON.stringify(event));
    const res = await POST(req);
    const body = await res.json();

    expect(body.duplicate).toBe(true);
    expect(mockUpdate).not.toHaveBeenCalled(); // No debe procesar de nuevo
  });
});
