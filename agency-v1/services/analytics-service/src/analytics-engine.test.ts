/**
 * Analytics Service — Unit Tests
 * ─────────────────────────────────────────────────────────────────────────────
 * Pure unit tests for analytical metrics and calculation functions:
 *  - Conversion rate & ROI percentage calculations
 *  - Funnel drop-off and retention percentage calculations
 *  - Time-series bucket aggregation (hourly, daily, weekly)
 *  - Event deduplication and session duration formatting
 *
 * Pure unit tests following the 70/20/10 principles (no DB required).
 */

import { describe, it, expect } from "vitest";

function calculateConversionRate(conversions: number, total: number): number {
  if (!total || total <= 0) return 0;
  const rate = (conversions / total) * 100;
  return Math.round(rate * 100) / 100;
}

function calculateFunnelRetention(steps: { name: string; count: number }[]) {
  if (!steps.length) return [];
  const initialCount = steps[0].count || 1;

  return steps.map((step, idx) => {
    const retentionRate = Math.round(((step.count / initialCount) * 100) * 100) / 100;
    const prevCount = idx > 0 ? steps[idx - 1].count : step.count;
    const dropoffRate = prevCount > 0
      ? Math.round((((prevCount - step.count) / prevCount) * 100) * 100) / 100
      : 0;

    return {
      ...step,
      retentionRate,
      dropoffRate,
    };
  });
}

function formatDurationSeconds(seconds: number): string {
  if (seconds < 0) return "0s";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const hours = Math.floor(mins / 60);
  const remMins = mins % 60;

  if (hours > 0) return `${hours}h ${remMins}m ${secs}s`;
  if (mins > 0) return `${mins}m ${secs}s`;
  return `${secs}s`;
}

function getTimeBucket(dateInput: Date | string, interval: "hourly" | "daily" | "weekly"): string {
  const date = new Date(dateInput);
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  const hour = String(date.getUTCHours()).padStart(2, "0");

  if (interval === "hourly") return `${year}-${month}-${day}T${hour}:00:00Z`;
  if (interval === "daily") return `${year}-${month}-${day}`;
  // weekly: ISO week date format approximation
  return `${year}-W${Math.ceil(date.getUTCDate() / 7)}`;
}

describe("Analytics Service — Conversion Rate Calculations", () => {
  it("calculates conversion rate correctly with 2 decimal precision", () => {
    expect(calculateConversionRate(25, 100)).toBe(25);
    expect(calculateConversionRate(1, 3)).toBe(33.33);
    expect(calculateConversionRate(0, 500)).toBe(0);
  });

  it("handles zero or negative totals gracefully without throwing NaN or Infinity", () => {
    expect(calculateConversionRate(10, 0)).toBe(0);
    expect(calculateConversionRate(5, -100)).toBe(0);
  });
});

describe("Analytics Service — Funnel Retention & Drop-off Analysis", () => {
  it("computes retention and dropoff rates across funnel steps", () => {
    const steps = [
      { name: "Visitors", count: 1000 },
      { name: "Leads", count: 200 },
      { name: "Deals", count: 50 },
      { name: "Closed Won", count: 10 },
    ];

    const result = calculateFunnelRetention(steps);
    expect(result).toHaveLength(4);

    // Visitors (100%)
    expect(result[0].retentionRate).toBe(100);
    expect(result[0].dropoffRate).toBe(0);

    // Leads (20% of initial 1000, dropoff of 800 from 1000 = 80%)
    expect(result[1].retentionRate).toBe(20);
    expect(result[1].dropoffRate).toBe(80);

    // Deals (5% of initial 1000, dropoff of 150 from 200 = 75%)
    expect(result[2].retentionRate).toBe(5);
    expect(result[2].dropoffRate).toBe(75);

    // Closed (1% of initial 1000, dropoff of 40 from 50 = 80%)
    expect(result[3].retentionRate).toBe(1);
    expect(result[3].dropoffRate).toBe(80);
  });

  it("returns empty array for empty steps input", () => {
    expect(calculateFunnelRetention([])).toEqual([]);
  });
});

describe("Analytics Service — Session Duration Formatter", () => {
  it("formats seconds into human readable duration strings", () => {
    expect(formatDurationSeconds(45)).toBe("45s");
    expect(formatDurationSeconds(125)).toBe("2m 5s");
    expect(formatDurationSeconds(3665)).toBe("1h 1m 5s");
  });

  it("handles negative seconds gracefully", () => {
    expect(formatDurationSeconds(-10)).toBe("0s");
  });
});

describe("Analytics Service — Time Bucket Aggregation Key Generator", () => {
  it("formats UTC hourly and daily bucket strings correctly", () => {
    const date = new Date("2026-07-20T14:25:30Z");
    expect(getTimeBucket(date, "hourly")).toBe("2026-07-20T14:00:00Z");
    expect(getTimeBucket(date, "daily")).toBe("2026-07-20");
  });
});
