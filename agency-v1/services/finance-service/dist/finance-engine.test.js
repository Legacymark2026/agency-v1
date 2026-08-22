"use strict";
/**
 * Finance Service — Unit Tests
 * ─────────────────────────────────────────────────────────────────────────────
 * Pure unit tests for financial calculations:
 *  - Invoice totals, tax (19% IVA), discounts, subtotal calculations
 *  - Stripe cents conversion & processing fee calculations
 *  - Invoice state machine transition validation
 *
 * Follows 70/20/10 testing strategy (zero external I/O).
 */
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
function calculateInvoiceTotals(items, taxRate = 0.19, // 19% IVA default
discountPercent = 0) {
    const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
    const discountAmount = subtotal * (discountPercent / 100);
    const taxableAmount = Math.max(0, subtotal - discountAmount);
    const taxAmount = taxableAmount * taxRate;
    const total = taxableAmount + taxAmount;
    return {
        subtotal: Math.round(subtotal * 100) / 100,
        discountAmount: Math.round(discountAmount * 100) / 100,
        taxableAmount: Math.round(taxableAmount * 100) / 100,
        taxAmount: Math.round(taxAmount * 100) / 100,
        total: Math.round(total * 100) / 100,
    };
}
function convertToStripeCents(amount) {
    return Math.round(amount * 100);
}
function calculateStripeFee(amount, feePercent = 3.5, fixedFee = 0.3) {
    const fee = (amount * (feePercent / 100)) + fixedFee;
    const net = amount - fee;
    return {
        fee: Math.round(fee * 100) / 100,
        net: Math.round(net * 100) / 100,
    };
}
function isValidStatusTransition(currentStatus, newStatus) {
    const allowedTransitions = {
        DRAFT: ["SENT", "CANCELLED"],
        SENT: ["PAID", "OVERDUE", "CANCELLED"],
        OVERDUE: ["PAID", "CANCELLED"],
        PAID: [], // Terminal state
        CANCELLED: [], // Terminal state
    };
    return allowedTransitions[currentStatus]?.includes(newStatus) ?? false;
}
(0, vitest_1.describe)("Finance Service — Invoice Total Calculations", () => {
    (0, vitest_1.it)("calculates subtotal, 19% VAT tax, and total accurately", () => {
        const items = [
            { description: "Development Hours", quantity: 10, unitPrice: 50 }, // 500
            { description: "Hosting Setup", quantity: 1, unitPrice: 100 }, // 100
        ];
        const result = calculateInvoiceTotals(items, 0.19, 0);
        (0, vitest_1.expect)(result.subtotal).toBe(600);
        (0, vitest_1.expect)(result.discountAmount).toBe(0);
        (0, vitest_1.expect)(result.taxableAmount).toBe(600);
        (0, vitest_1.expect)(result.taxAmount).toBe(114); // 600 * 0.19 = 114
        (0, vitest_1.expect)(result.total).toBe(714); // 600 + 114 = 714
    });
    (0, vitest_1.it)("applies promotional discount before calculating tax", () => {
        const items = [{ description: "Service Plan", quantity: 1, unitPrice: 1000 }];
        const result = calculateInvoiceTotals(items, 0.19, 10); // 10% discount
        (0, vitest_1.expect)(result.subtotal).toBe(1000);
        (0, vitest_1.expect)(result.discountAmount).toBe(100);
        (0, vitest_1.expect)(result.taxableAmount).toBe(900);
        (0, vitest_1.expect)(result.taxAmount).toBe(171); // 900 * 0.19 = 171
        (0, vitest_1.expect)(result.total).toBe(1071); // 900 + 171 = 1071
    });
});
(0, vitest_1.describe)("Finance Service — Stripe Amount & Fee Helpers", () => {
    (0, vitest_1.it)("converts decimal currency amounts to Stripe integer cents", () => {
        (0, vitest_1.expect)(convertToStripeCents(19.99)).toBe(1999);
        (0, vitest_1.expect)(convertToStripeCents(100)).toBe(10000);
    });
    (0, vitest_1.it)("calculates Stripe fee and net payout correctly", () => {
        const { fee, net } = calculateStripeFee(100, 3.5, 0.3);
        (0, vitest_1.expect)(fee).toBe(3.8); // 3.5 + 0.3 = 3.8
        (0, vitest_1.expect)(net).toBe(96.2); // 100 - 3.8 = 96.2
    });
});
(0, vitest_1.describe)("Finance Service — Invoice Status State Machine", () => {
    (0, vitest_1.it)("allows valid invoice status transitions", () => {
        (0, vitest_1.expect)(isValidStatusTransition("DRAFT", "SENT")).toBe(true);
        (0, vitest_1.expect)(isValidStatusTransition("SENT", "PAID")).toBe(true);
        (0, vitest_1.expect)(isValidStatusTransition("SENT", "OVERDUE")).toBe(true);
        (0, vitest_1.expect)(isValidStatusTransition("OVERDUE", "PAID")).toBe(true);
    });
    (0, vitest_1.it)("blocks invalid invoice status transitions", () => {
        (0, vitest_1.expect)(isValidStatusTransition("DRAFT", "PAID")).toBe(false);
        (0, vitest_1.expect)(isValidStatusTransition("PAID", "SENT")).toBe(false);
        (0, vitest_1.expect)(isValidStatusTransition("CANCELLED", "SENT")).toBe(false);
    });
});
//# sourceMappingURL=finance-engine.test.js.map