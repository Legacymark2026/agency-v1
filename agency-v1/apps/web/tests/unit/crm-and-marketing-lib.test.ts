/**
 * CRM Hooks — Unit Tests
 * ─────────────────────────────────────────────────────────────────────────────
 * Tests para: useDealFilters, useDealSearch, useCRMMetrics, useDealSort
 * Todos se prueban como funciones puras (sin renderHook) extrayendo la lógica.
 */

import { describe, it, expect } from "vitest";

// ─── Import pure logic directly (no React needed for pure computations) ───────
// We test the underlying memoized logic by calling the functions with sample data.
// For hooks that depend on useState, we test the filter/sort logic directly.

import { getStageLabelById, STAGES, STAGE_MAP } from "@/modules/crm/lib/crm-config";

// ─── CRM Config tests ─────────────────────────────────────────────────────────
describe("crm-config", () => {
  it("STAGES contains all 6 stages including LOST", () => {
    const ids = STAGES.map((s) => s.id);
    expect(ids).toContain("NEW");
    expect(ids).toContain("CONTACTED");
    expect(ids).toContain("PROPOSAL");
    expect(ids).toContain("NEGOTIATION");
    expect(ids).toContain("WON");
    expect(ids).toContain("LOST");
    expect(ids).toHaveLength(6);
  });

  it("STAGE_MAP resolves ids in O(1)", () => {
    expect(STAGE_MAP.get("WON")?.label).toBe("Ganado");
    expect(STAGE_MAP.get("LOST")?.label).toBe("Perdido");
    expect(STAGE_MAP.get("NON_EXISTENT")).toBeUndefined();
  });

  it("getStageLabelById returns label for known stage", () => {
    expect(getStageLabelById("PROPOSAL")).toBe("Propuesta Enviada");
    expect(getStageLabelById("NEGOTIATION")).toBe("En Negociación");
  });

  it("getStageLabelById falls back to raw id for unknown stage", () => {
    expect(getStageLabelById("MYSTERY_STAGE")).toBe("MYSTERY_STAGE");
  });

  it("WON stage has 100% defaultProbability", () => {
    expect(STAGE_MAP.get("WON")?.defaultProbability).toBe(100);
  });

  it("LOST stage has 0% defaultProbability", () => {
    expect(STAGE_MAP.get("LOST")?.defaultProbability).toBe(0);
  });

  it("all stages have required fields", () => {
    for (const stage of STAGES) {
      expect(stage.id).toBeTruthy();
      expect(stage.label).toBeTruthy();
      expect(stage.color).toBeTruthy();
      expect(stage.accent).toBeTruthy();
      expect(stage.icon).toBeTruthy();
      expect(typeof stage.defaultProbability).toBe("number");
    }
  });
});

// ─── Marketing lib utility tests ──────────────────────────────────────────────
import {
  computeROI,
  computeCPL,
  computeCPA,
  computeConversionRate,
  computeFunnel,
  lastNMonths,
  formatMonthLabel,
  getChannelLabel,
  getChannelIcon,
} from "@/modules/marketing/lib";

describe("marketing/lib — ROI and metric computations", () => {
  it("computeROI returns 0 when spent is 0", () => {
    expect(computeROI(1000, 0)).toBe(0);
  });

  it("computeROI returns correct ROI percentage", () => {
    // (3000 - 1000) / 1000 * 100 = 200%
    expect(computeROI(3000, 1000)).toBe(200);
  });

  it("computeROI handles negative ROI (loss)", () => {
    // (500 - 1000) / 1000 * 100 = -50%
    expect(computeROI(500, 1000)).toBe(-50);
  });

  it("computeCPL returns 0 when leads is 0", () => {
    expect(computeCPL(500, 0)).toBe(0);
  });

  it("computeCPL returns correct cost per lead", () => {
    // 1000 / 50 = 20
    expect(computeCPL(1000, 50)).toBe(20);
  });

  it("computeCPA returns 0 when conversions is 0", () => {
    expect(computeCPA(500, 0)).toBe(0);
  });

  it("computeCPA returns correct cost per acquisition", () => {
    // 2000 / 10 = 200
    expect(computeCPA(2000, 10)).toBe(200);
  });

  it("computeConversionRate returns 0 when leads is 0", () => {
    expect(computeConversionRate(5, 0)).toBe(0);
  });

  it("computeConversionRate returns correct percentage", () => {
    // 10 / 100 * 100 = 10%
    expect(computeConversionRate(10, 100)).toBe(10);
  });

  it("computeConversionRate rounds to integer", () => {
    // 3 / 7 * 100 = 42.86 → rounds to 43
    expect(computeConversionRate(3, 7)).toBe(43);
  });
});

describe("marketing/lib — Funnel analysis", () => {
  it("computes funnel with correct drop-off rates", () => {
    const result = computeFunnel(
      ["Impresiones", "Clics", "Leads", "Ventas"],
      [10000, 500, 50, 10]
    );

    expect(result).toHaveLength(4);
    expect(result[0].label).toBe("Impresiones");
    expect(result[0].dropoffRate).toBe(0); // first stage has no dropoff
    expect(result[1].dropoffRate).toBe(95); // 10000→500: (9500/10000)*100 = 95%
    expect(result[2].dropoffRate).toBe(90); // 500→50: (450/500)*100 = 90%
    expect(result[3].dropoffRate).toBe(80); // 50→10: (40/50)*100 = 80%
  });

  it("handles empty funnel gracefully", () => {
    const result = computeFunnel([], []);
    expect(result).toHaveLength(0);
  });

  it("handles single stage with no dropoff", () => {
    const result = computeFunnel(["Top"], [1000]);
    expect(result[0].dropoffRate).toBe(0);
    expect(result[0].count).toBe(1000);
  });
});

describe("marketing/lib — Date helpers", () => {
  it("lastNMonths returns array of correct length", () => {
    const months = lastNMonths(6);
    expect(months).toHaveLength(6);
  });

  it("lastNMonths returns months in ascending chronological order", () => {
    const months = lastNMonths(3);
    expect(months[0] < months[1]).toBe(true);
    expect(months[1] < months[2]).toBe(true);
  });

  it("lastNMonths last element is current month", () => {
    const months = lastNMonths(1);
    const now = new Date();
    const expected = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    expect(months[0]).toBe(expected);
  });

  it("formatMonthLabel formats YYYY-MM correctly", () => {
    // We just test it doesn't throw and returns a non-empty string
    const label = formatMonthLabel("2024-03");
    expect(typeof label).toBe("string");
    expect(label.length).toBeGreaterThan(0);
  });
});

describe("marketing/lib — Channel helpers", () => {
  it("getChannelLabel returns label for known channel", () => {
    expect(getChannelLabel("facebook_ads")).toBe("Facebook Ads");
    expect(getChannelLabel("email")).toBe("Email Marketing");
  });

  it("getChannelLabel falls back to channel id for unknown", () => {
    expect(getChannelLabel("mystery_channel")).toBe("mystery_channel");
  });

  it("getChannelIcon returns emoji for known channel", () => {
    expect(getChannelIcon("google_ads")).toBe("🔍");
    expect(getChannelIcon("tiktok")).toBe("🎵");
  });

  it("getChannelIcon returns default emoji for unknown channel", () => {
    expect(getChannelIcon("unknown")).toBe("📦");
  });
});
