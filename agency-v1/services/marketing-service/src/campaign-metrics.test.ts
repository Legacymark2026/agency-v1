/**
 * Marketing Service — Unit Tests
 * ─────────────────────────────────────────────────────────────────────────────
 * Pure unit tests for marketing metrics, ROI, CPL, CPA, and campaign budget calculations.
 *
 * Follows 70/20/10 testing principles (fast unit tests, zero external I/O).
 */

import { describe, it, expect } from "vitest";

interface CampaignMetrics {
  spend: number;
  revenue: number;
  leads: number;
  acquisitions: number;
}

function calculateCPL(spend: number, leads: number): number {
  if (!leads || leads <= 0) return 0;
  return Math.round((spend / leads) * 100) / 100;
}

function calculateCPA(spend: number, acquisitions: number): number {
  if (!acquisitions || acquisitions <= 0) return 0;
  return Math.round((spend / acquisitions) * 100) / 100;
}

function calculateROI(spend: number, revenue: number): number {
  if (!spend || spend <= 0) return 0;
  const roi = ((revenue - spend) / spend) * 100;
  return Math.round(roi * 100) / 100;
}

function calculateROAS(spend: number, revenue: number): number {
  if (!spend || spend <= 0) return 0;
  const roas = revenue / spend;
  return Math.round(roas * 100) / 100;
}

function evaluateCampaignHealth(metrics: CampaignMetrics, targetCPL: number): "EXCELLENT" | "GOOD" | "UNDERPERFORMING" | "CRITICAL" {
  const actualCPL = calculateCPL(metrics.spend, metrics.leads);
  const roi = calculateROI(metrics.spend, metrics.revenue);

  if (metrics.spend > 0 && metrics.leads === 0) return "CRITICAL";
  if (actualCPL <= targetCPL * 0.8 && roi > 50) return "EXCELLENT";
  if (actualCPL <= targetCPL && roi >= 0) return "GOOD";
  return "UNDERPERFORMING";
}

describe("Marketing Metrics — CPL (Cost Per Lead)", () => {
  it("calculates cost per lead accurately", () => {
    expect(calculateCPL(1000, 50)).toBe(20);
    expect(calculateCPL(500, 33)).toBe(15.15);
  });

  it("handles 0 leads gracefully without dividing by zero", () => {
    expect(calculateCPL(1000, 0)).toBe(0);
  });
});

describe("Marketing Metrics — CPA (Cost Per Acquisition)", () => {
  it("calculates cost per acquisition accurately", () => {
    expect(calculateCPA(2000, 10)).toBe(200);
    expect(calculateCPA(1500, 7)).toBe(214.29);
  });

  it("handles 0 acquisitions gracefully", () => {
    expect(calculateCPA(500, 0)).toBe(0);
  });
});

describe("Marketing Metrics — ROI & ROAS", () => {
  it("calculates positive ROI and ROAS correctly", () => {
    expect(calculateROI(1000, 3000)).toBe(200); // (3000-1000)/1000 * 100 = 200%
    expect(calculateROAS(1000, 3000)).toBe(3); // 3x ROAS
  });

  it("calculates negative ROI for un-profitable campaigns", () => {
    expect(calculateROI(1000, 400)).toBe(-60); // (400-1000)/1000 * 100 = -60%
    expect(calculateROAS(1000, 400)).toBe(0.4);
  });

  it("handles zero spend without dividing by zero", () => {
    expect(calculateROI(0, 500)).toBe(0);
    expect(calculateROAS(0, 500)).toBe(0);
  });
});

describe("Marketing Metrics — Campaign Health Evaluator", () => {
  it("returns EXCELLENT when CPL is low and ROI is high (>50%)", () => {
    const metrics: CampaignMetrics = { spend: 1000, revenue: 2500, leads: 100, acquisitions: 20 };
    // CPL = 10 (target 20, <= 16), ROI = 150%
    expect(evaluateCampaignHealth(metrics, 20)).toBe("EXCELLENT");
  });

  it("returns GOOD when CPL is within target and ROI is positive", () => {
    const metrics: CampaignMetrics = { spend: 1000, revenue: 1200, leads: 50, acquisitions: 5 };
    // CPL = 20 (target 20), ROI = 20%
    expect(evaluateCampaignHealth(metrics, 20)).toBe("GOOD");
  });

  it("returns CRITICAL when spend > 0 but 0 leads generated", () => {
    const metrics: CampaignMetrics = { spend: 500, revenue: 0, leads: 0, acquisitions: 0 };
    expect(evaluateCampaignHealth(metrics, 25)).toBe("CRITICAL");
  });

  it("returns UNDERPERFORMING when CPL exceeds target or ROI is negative", () => {
    const metrics: CampaignMetrics = { spend: 1000, revenue: 800, leads: 20, acquisitions: 2 };
    // CPL = 50 (target 20), ROI = -20%
    expect(evaluateCampaignHealth(metrics, 20)).toBe("UNDERPERFORMING");
  });
});
