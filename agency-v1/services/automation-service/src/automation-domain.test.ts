/**
 * Automation Domain Unit Tests
 * ─────────────────────────────────────────────────────────────────────────────
 * Tests:
 *  - Workflow execution success rate calculation
 *  - Cron secret authentication guard
 *  - Condition node evaluation logic
 */
import { describe, it, expect } from "vitest";

describe("Automation Service Domain Tests", () => {
  describe("Analytics & Success Rate", () => {
    function calculateSuccessRate(total: number, failed: number): number {
      if (total <= 0) return 0;
      return Math.round(((total - failed) / total) * 100);
    }

    it("calculates 100% success rate when zero executions failed", () => {
      expect(calculateSuccessRate(100, 0)).toBe(100);
    });

    it("calculates correct percentage on mixed executions", () => {
      expect(calculateSuccessRate(100, 25)).toBe(75);
      expect(calculateSuccessRate(50, 5)).toBe(90);
    });

    it("returns 0% when there are no executions", () => {
      expect(calculateSuccessRate(0, 0)).toBe(0);
    });
  });

  describe("Cron Secret Verification", () => {
    function isCronAuthorized(providedSecret: string | undefined, expectedSecret: string | undefined): boolean {
      if (!expectedSecret) return true; // Staging fallback
      return providedSecret === expectedSecret;
    }

    it("authorizes request when CRON_SECRET matches exactly", () => {
      expect(isCronAuthorized("secret-cron-token-123", "secret-cron-token-123")).toBe(true);
    });

    it("rejects unauthorized cron trigger requests", () => {
      expect(isCronAuthorized("wrong-token", "secret-cron-token-123")).toBe(false);
      expect(isCronAuthorized(undefined, "secret-cron-token-123")).toBe(false);
    });
  });

  describe("Workflow Condition Evaluator", () => {
    function evaluateCondition(left: unknown, operator: string, right: unknown): boolean {
      switch (operator) {
        case "EQUALS": return String(left) === String(right);
        case "NOT_EQUALS": return String(left) !== String(right);
        case "GREATER_THAN": return Number(left) > Number(right);
        case "LESS_THAN": return Number(left) < Number(right);
        case "CONTAINS": return typeof left === "string" && left.includes(String(right));
        default: return false;
      }
    }

    it("evaluates string EQUALS and CONTAINS operators", () => {
      expect(evaluateCondition("WON", "EQUALS", "WON")).toBe(true);
      expect(evaluateCondition("LOST", "EQUALS", "WON")).toBe(false);
      expect(evaluateCondition("Qualified Lead", "CONTAINS", "Lead")).toBe(true);
    });

    it("evaluates numeric GREATER_THAN and LESS_THAN operators", () => {
      expect(evaluateCondition(5000, "GREATER_THAN", 1000)).toBe(true);
      expect(evaluateCondition(500, "GREATER_THAN", 1000)).toBe(false);
      expect(evaluateCondition(50, "LESS_THAN", 100)).toBe(true);
    });
  });
});
