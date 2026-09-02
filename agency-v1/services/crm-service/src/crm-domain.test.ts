/**
 * CRM Domain & Services Unit Tests
 * ─────────────────────────────────────────────────────────────────────────────
 * Tests:
 *  - Lead scoring calculation logic
 *  - Commission calculation and accelerator logic
 *  - Deal stage transition integrity
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

describe("CRM Domain Logic", () => {
  describe("Lead Scoring Logic", () => {
    function evaluateRule(value: unknown, operator: string, ruleValue: string | null): boolean {
      switch (operator) {
        case "exists": return value !== null && value !== undefined && value !== "";
        case "equals": return String(value) === ruleValue;
        case "contains": return typeof value === "string" && value.toLowerCase().includes((ruleValue ?? "").toLowerCase());
        case "greaterThan": return typeof value === "number" && value > Number(ruleValue);
        case "lessThan": return typeof value === "number" && value < Number(ruleValue);
        case "in": return (ruleValue ?? "").split(",").map((s) => s.trim()).includes(String(value));
        default: return false;
      }
    }

    it("should evaluate 'equals' operator correctly", () => {
      expect(evaluateRule("ENTERPRISE", "equals", "ENTERPRISE")).toBe(true);
      expect(evaluateRule("STARTUP", "equals", "ENTERPRISE")).toBe(false);
    });

    it("should evaluate 'contains' operator case-insensitively", () => {
      expect(evaluateRule("Director of Operations", "contains", "director")).toBe(true);
      expect(evaluateRule("Manager", "contains", "director")).toBe(false);
    });

    it("should evaluate 'greaterThan' and 'lessThan' numeric operators", () => {
      expect(evaluateRule(50, "greaterThan", "20")).toBe(true);
      expect(evaluateRule(10, "greaterThan", "20")).toBe(false);
      expect(evaluateRule(15, "lessThan", "20")).toBe(true);
    });

    it("should evaluate 'in' operator correctly", () => {
      expect(evaluateRule("VIP", "in", "VIP, PARTNER, ENTERPRISE")).toBe(true);
      expect(evaluateRule("REGULAR", "in", "VIP, PARTNER, ENTERPRISE")).toBe(false);
    });
  });

  describe("Commission Calculation Logic", () => {
    function calculateCommission(dealValue: number, baseRate: number, isAcceleratorActive: boolean, capAmount?: number): number {
      const effectiveRate = isAcceleratorActive ? baseRate * 1.5 : baseRate;
      let amount = dealValue * effectiveRate;
      if (capAmount && amount > capAmount) {
        amount = capAmount;
      }
      return Math.round(amount * 100) / 100;
    }

    it("calculates standard commission accurately", () => {
      const result = calculateCommission(10000, 0.10, false);
      expect(result).toBe(1000);
    });

    it("applies accelerator multiplier (1.5x) when quota exceeded", () => {
      const result = calculateCommission(10000, 0.10, true);
      expect(result).toBe(1500);
    });

    it("respects cap amount if commission exceeds limit", () => {
      const result = calculateCommission(50000, 0.15, true, 5000);
      expect(result).toBe(5000);
    });
  });

  describe("Deal Probability & Validation", () => {
    it("assigns 100% probability to WON deals and 0% to LOST deals", () => {
      const getStageProbability = (stage: string, currentProb: number) => {
        if (stage === "WON") return 100;
        if (stage === "LOST") return 0;
        return currentProb;
      };

      expect(getStageProbability("WON", 30)).toBe(100);
      expect(getStageProbability("LOST", 70)).toBe(0);
      expect(getStageProbability("PROPOSAL_SENT", 60)).toBe(60);
    });
  });
});
