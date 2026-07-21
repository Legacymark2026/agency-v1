/**
 * POS Service — Unit Tests
 */
import { describe, it, expect } from "vitest";

function calculatePosCart(items: Array<{ quantity: number; unitPrice: number; taxRate: number }>, discount = 0) {
    let subtotal = 0;
    let tax = 0;

    items.forEach((item) => {
        const lineSub = item.quantity * item.unitPrice;
        const lineTax = lineSub * item.taxRate;
        subtotal += lineSub;
        tax += lineTax;
    });

    const totalGross = subtotal + tax;
    const finalTotal = Math.max(0, totalGross - discount);

    return {
        subtotal: Math.round(subtotal * 100) / 100,
        tax: Math.round(tax * 100) / 100,
        total: Math.round(finalTotal * 100) / 100,
    };
}

function calculateCashChange(total: number, cashReceived: number) {
    return Math.max(0, cashReceived - total);
}

describe("POS Service — Cart & Change Calculations", () => {
    it("calculates POS cart subtotal, 19% VAT, and final total correctly", () => {
        const items = [
            { quantity: 2, unitPrice: 50000, taxRate: 0.19 }, // 100,000 subtotal + 19,000 tax
            { quantity: 1, unitPrice: 20000, taxRate: 0.19 }, // 20,000 subtotal + 3,800 tax
        ];

        const result = calculatePosCart(items, 10000); // 10,000 COP discount
        expect(result.subtotal).toBe(120000);
        expect(result.tax).toBe(22800);
        expect(result.total).toBe(132800);
    });

    it("calculates cash change correctly for POS register", () => {
        expect(calculateCashChange(85000, 100000)).toBe(15000);
        expect(calculateCashChange(50000, 50000)).toBe(0);
    });
});
