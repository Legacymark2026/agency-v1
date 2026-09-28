"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Analytics Domain Unit Tests
 * ─────────────────────────────────────────────────────────────────────────────
 * Tests:
 *  - Linear regression algorithm for sales forecasting
 *  - Division-by-zero guard on growth rate calculations
 *  - Pagination bounds clamping (1 <= limit <= 100)
 *  - Partition range date formatting
 */
const vitest_1 = require("vitest");
(0, vitest_1.describe)("Analytics Service Domain Tests", () => {
    (0, vitest_1.describe)("Linear Regression & Sales Forecasting", () => {
        function computeLinearRegression(y) {
            const x = y.map((_, i) => i);
            const n = x.length;
            if (n === 0)
                return { slope: 0, intercept: 0, forecast: 0 };
            let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
            for (let i = 0; i < n; i++) {
                sumX += x[i];
                sumY += y[i];
                sumXY += x[i] * y[i];
                sumXX += x[i] * x[i];
            }
            const denominator = (n * sumXX - sumX * sumX);
            if (denominator === 0)
                return { slope: 0, intercept: sumY / n, forecast: sumY / n };
            const slope = (n * sumXY - sumX * sumY) / denominator;
            const intercept = (sumY - slope * sumX) / n;
            const forecast = Math.max(0, slope * n + intercept);
            return { slope, intercept, forecast };
        }
        (0, vitest_1.it)("forecasts upward trend correctly for growing weekly sales", () => {
            const sales = [1000, 2000, 3000, 4000];
            const { slope, forecast } = computeLinearRegression(sales);
            (0, vitest_1.expect)(slope).toBeCloseTo(1000);
            (0, vitest_1.expect)(forecast).toBeCloseTo(5000);
        });
        (0, vitest_1.it)("handles zero sales gracefully without NaN", () => {
            const sales = [0, 0, 0, 0];
            const { forecast } = computeLinearRegression(sales);
            (0, vitest_1.expect)(forecast).toBe(0);
            (0, vitest_1.expect)(Number.isNaN(forecast)).toBe(false);
        });
    });
    (0, vitest_1.describe)("Growth Rate Calculation", () => {
        function computeGrowthRate(predicted, lastWeek) {
            const base = lastWeek <= 0 ? 1 : lastWeek;
            return (predicted - lastWeek) / base;
        }
        (0, vitest_1.it)("calculates positive growth rate correctly", () => {
            (0, vitest_1.expect)(computeGrowthRate(1500, 1000)).toBeCloseTo(0.5);
        });
        (0, vitest_1.it)("guards against division by zero when lastWeek sales is zero", () => {
            const rate = computeGrowthRate(100, 0);
            (0, vitest_1.expect)(Number.isFinite(rate)).toBe(true);
            (0, vitest_1.expect)(rate).toBe(100);
        });
    });
    (0, vitest_1.describe)("Pagination Bounds Clamping", () => {
        function clampPaginationLimit(raw) {
            const val = raw ? Number(raw) : 50;
            return Math.min(Math.max(1, isNaN(val) ? 50 : val), 100);
        }
        (0, vitest_1.it)("clamps limit between 1 and 100", () => {
            (0, vitest_1.expect)(clampPaginationLimit(500)).toBe(100);
            (0, vitest_1.expect)(clampPaginationLimit(-10)).toBe(1);
            (0, vitest_1.expect)(clampPaginationLimit(25)).toBe(25);
            (0, vitest_1.expect)(clampPaginationLimit(undefined)).toBe(50);
        });
    });
});
//# sourceMappingURL=analytics-domain.test.js.map