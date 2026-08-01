"use strict";
/**
 * Marketing Service — Unit Tests
 * ─────────────────────────────────────────────────────────────────────────────
 * Pure unit tests for marketing metrics, ROI, CPL, CPA, and campaign budget calculations.
 *
 * Follows 70/20/10 testing principles (fast unit tests, zero external I/O).
 */
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
function calculateCPL(spend, leads) {
    if (!leads || leads <= 0)
        return 0;
    return Math.round((spend / leads) * 100) / 100;
}
function calculateCPA(spend, acquisitions) {
    if (!acquisitions || acquisitions <= 0)
        return 0;
    return Math.round((spend / acquisitions) * 100) / 100;
}
function calculateROI(spend, revenue) {
    if (!spend || spend <= 0)
        return 0;
    const roi = ((revenue - spend) / spend) * 100;
    return Math.round(roi * 100) / 100;
}
function calculateROAS(spend, revenue) {
    if (!spend || spend <= 0)
        return 0;
    const roas = revenue / spend;
    return Math.round(roas * 100) / 100;
}
function evaluateCampaignHealth(metrics, targetCPL) {
    const actualCPL = calculateCPL(metrics.spend, metrics.leads);
    const roi = calculateROI(metrics.spend, metrics.revenue);
    if (metrics.spend > 0 && metrics.leads === 0)
        return "CRITICAL";
    if (actualCPL <= targetCPL * 0.8 && roi > 50)
        return "EXCELLENT";
    if (actualCPL <= targetCPL && roi >= 0)
        return "GOOD";
    return "UNDERPERFORMING";
}
(0, vitest_1.describe)("Marketing Metrics — CPL (Cost Per Lead)", () => {
    (0, vitest_1.it)("calculates cost per lead accurately", () => {
        (0, vitest_1.expect)(calculateCPL(1000, 50)).toBe(20);
        (0, vitest_1.expect)(calculateCPL(500, 33)).toBe(15.15);
    });
    (0, vitest_1.it)("handles 0 leads gracefully without dividing by zero", () => {
        (0, vitest_1.expect)(calculateCPL(1000, 0)).toBe(0);
    });
});
(0, vitest_1.describe)("Marketing Metrics — CPA (Cost Per Acquisition)", () => {
    (0, vitest_1.it)("calculates cost per acquisition accurately", () => {
        (0, vitest_1.expect)(calculateCPA(2000, 10)).toBe(200);
        (0, vitest_1.expect)(calculateCPA(1500, 7)).toBe(214.29);
    });
    (0, vitest_1.it)("handles 0 acquisitions gracefully", () => {
        (0, vitest_1.expect)(calculateCPA(500, 0)).toBe(0);
    });
});
(0, vitest_1.describe)("Marketing Metrics — ROI & ROAS", () => {
    (0, vitest_1.it)("calculates positive ROI and ROAS correctly", () => {
        (0, vitest_1.expect)(calculateROI(1000, 3000)).toBe(200); // (3000-1000)/1000 * 100 = 200%
        (0, vitest_1.expect)(calculateROAS(1000, 3000)).toBe(3); // 3x ROAS
    });
    (0, vitest_1.it)("calculates negative ROI for un-profitable campaigns", () => {
        (0, vitest_1.expect)(calculateROI(1000, 400)).toBe(-60); // (400-1000)/1000 * 100 = -60%
        (0, vitest_1.expect)(calculateROAS(1000, 400)).toBe(0.4);
    });
    (0, vitest_1.it)("handles zero spend without dividing by zero", () => {
        (0, vitest_1.expect)(calculateROI(0, 500)).toBe(0);
        (0, vitest_1.expect)(calculateROAS(0, 500)).toBe(0);
    });
});
(0, vitest_1.describe)("Marketing Metrics — Campaign Health Evaluator", () => {
    (0, vitest_1.it)("returns EXCELLENT when CPL is low and ROI is high (>50%)", () => {
        const metrics = { spend: 1000, revenue: 2500, leads: 100, acquisitions: 20 };
        // CPL = 10 (target 20, <= 16), ROI = 150%
        (0, vitest_1.expect)(evaluateCampaignHealth(metrics, 20)).toBe("EXCELLENT");
    });
    (0, vitest_1.it)("returns GOOD when CPL is within target and ROI is positive", () => {
        const metrics = { spend: 1000, revenue: 1200, leads: 50, acquisitions: 5 };
        // CPL = 20 (target 20), ROI = 20%
        (0, vitest_1.expect)(evaluateCampaignHealth(metrics, 20)).toBe("GOOD");
    });
    (0, vitest_1.it)("returns CRITICAL when spend > 0 but 0 leads generated", () => {
        const metrics = { spend: 500, revenue: 0, leads: 0, acquisitions: 0 };
        (0, vitest_1.expect)(evaluateCampaignHealth(metrics, 25)).toBe("CRITICAL");
    });
    (0, vitest_1.it)("returns UNDERPERFORMING when CPL exceeds target or ROI is negative", () => {
        const metrics = { spend: 1000, revenue: 800, leads: 20, acquisitions: 2 };
        // CPL = 50 (target 20), ROI = -20%
        (0, vitest_1.expect)(evaluateCampaignHealth(metrics, 20)).toBe("UNDERPERFORMING");
    });
});
//# sourceMappingURL=campaign-metrics.test.js.map