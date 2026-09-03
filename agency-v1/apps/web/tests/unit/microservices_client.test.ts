import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  dispatchMicroserviceRequest,
  resetCircuitStates,
  getCircuitState,
} from "@/lib/microservices-client";

describe("Resilient Microservices Client & Hybrid Fallback Engine", () => {
  beforeEach(() => {
    resetCircuitStates();
    vi.restoreAllMocks();
  });

  it("returns microservice response when fetch succeeds", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ totalLeads: 42, activePipeline: 12 }),
      })
    );

    const res = await dispatchMicroserviceRequest({
      service: "crm-service",
      path: "/api/crm/stats",
    });

    expect(res.success).toBe(true);
    expect(res.data).toEqual({ totalLeads: 42, activePipeline: 12 });
    expect(res.isFallback).toBeUndefined();
    expect(res.correlationId).toContain("corr_fe_");
  });

  it("transparently triggers fallback when microservice returns 500 error", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({ error: "Internal Microservice Error" }),
      })
    );

    const fallbackMock = vi.fn().mockResolvedValue({ totalLeads: 15, source: "db_fallback" });

    const res = await dispatchMicroserviceRequest({
      service: "crm-service",
      path: "/api/crm/stats",
      retries: 0,
      fallback: fallbackMock,
    });

    expect(res.success).toBe(true);
    expect(res.isFallback).toBe(true);
    expect(res.data).toEqual({ totalLeads: 15, source: "db_fallback" });
    expect(fallbackMock).toHaveBeenCalledTimes(1);
  });

  it("transparently triggers fallback when network drops (ECONNREFUSED)", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("connect ECONNREFUSED 127.0.0.1:8080"))
    );

    const fallbackMock = vi.fn().mockResolvedValue([{ id: "deal_1", title: "Deal Local" }]);

    const res = await dispatchMicroserviceRequest({
      service: "crm-service",
      path: "/api/deals",
      retries: 0,
      fallback: fallbackMock,
    });

    expect(res.success).toBe(true);
    expect(res.isFallback).toBe(true);
    expect(res.data).toEqual([{ id: "deal_1", title: "Deal Local" }]);
    expect(fallbackMock).toHaveBeenCalledTimes(1);
  });

  it("opens circuit breaker after repeated failures and immediately invokes fallback without calling fetch", async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error("Network Error"));
    vi.stubGlobal("fetch", fetchMock);

    // Fail 3 times to trip circuit breaker (CIRCUIT_FAILURE_THRESHOLD = 3)
    await dispatchMicroserviceRequest({ service: "finance-service", path: "/api/invoices", retries: 0 });
    await dispatchMicroserviceRequest({ service: "finance-service", path: "/api/invoices", retries: 0 });
    await dispatchMicroserviceRequest({ service: "finance-service", path: "/api/invoices", retries: 0 });

    const state = getCircuitState("finance-service");
    expect(state.state).toBe("OPEN");

    // 4th call: circuit is OPEN. It must bypass fetch completely and call fallback directly
    fetchMock.mockClear();
    const fallbackMock = vi.fn().mockResolvedValue({ invoices: [] });

    const res = await dispatchMicroserviceRequest({
      service: "finance-service",
      path: "/api/invoices",
      fallback: fallbackMock,
    });

    expect(fetchMock).not.toHaveBeenCalled();
    expect(fallbackMock).toHaveBeenCalledTimes(1);
    expect(res.success).toBe(true);
    expect(res.isFallback).toBe(true);
  });
});
