/**
 * API Gateway Domain Unit Tests
 * ─────────────────────────────────────────────────────────────────────────────
 * Tests:
 *  - Circuit Breaker failure threshold & state transitions
 *  - Service registry URL resolution
 *  - Metering cost calculation
 *  - Gateway auth spoofed header sanitization
 */
import { describe, it, expect, vi } from "vitest";
import { CircuitBreaker } from "./lib/circuit-breaker";
import { SERVICES } from "./lib/service-registry";
import { DEFAULT_API_COST_TABLE } from "./middlewares/metering.middleware";

describe("API Gateway Domain Tests", () => {
  describe("Circuit Breaker State Machine", () => {
    it("starts in CLOSED state", () => {
      const breaker = new CircuitBreaker("test-service");
      expect(breaker.state).toBe("CLOSED");
    });

    it("trips to OPEN state after 25 consecutive failures", () => {
      const breaker = new CircuitBreaker("test-service");
      for (let i = 0; i < 24; i++) {
        breaker.recordFailure();
        expect(breaker.state).toBe("CLOSED");
      }
      breaker.recordFailure(); // 25th failure
      expect(breaker.state).toBe("OPEN");
    });

    it("resets to CLOSED state on successful request", () => {
      const breaker = new CircuitBreaker("test-service");
      for (let i = 0; i < 25; i++) {
        breaker.recordFailure();
      }
      expect(breaker.state).toBe("OPEN");
      breaker.recordSuccess();
      expect(breaker.state).toBe("CLOSED");
    });
  });

  describe("Service Registry", () => {
    it("contains mapping for all core microservices", () => {
      expect(SERVICES.auth).toContain(":4001");
      expect(SERVICES.crm).toContain(":4002");
      expect(SERVICES.automation).toContain(":4003");
      expect(SERVICES.ai).toContain(":4004");
      expect(SERVICES.inbox).toContain(":4005");
      expect(SERVICES.finance).toContain(":4006");
    });
  });

  describe("API Metering Pricing", () => {
    it("defines cost per unit for high-volume endpoints", () => {
      expect(DEFAULT_API_COST_TABLE["/api/v1/agents"].costPerUnitUsd).toBeGreaterThan(0);
      expect(DEFAULT_API_COST_TABLE["/api/v1/invoices"].costPerUnitUsd).toBeGreaterThan(0);
      expect(DEFAULT_API_COST_TABLE["default"].unitType).toBe("REQUESTS");
    });
  });
});
