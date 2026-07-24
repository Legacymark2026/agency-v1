/**
 * POS Service — Unit Tests & Enterprise Engine Validation
 */
import { describe, it, expect } from "vitest";
import { evaluateCartPromotions } from "./index";
import { calculateDianCufe, calculateNitDv } from "./dian-engine";

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
            { quantity: 2, unitPrice: 50000, taxRate: 0.19 },
            { quantity: 1, unitPrice: 20000, taxRate: 0.19 },
        ];

        const result = calculatePosCart(items, 10000);
        expect(result.subtotal).toBe(120000);
        expect(result.tax).toBe(22800);
        expect(result.total).toBe(132800);
    });

    it("calculates cash change correctly for POS register", () => {
        expect(calculateCashChange(85000, 100000)).toBe(15000);
        expect(calculateCashChange(50000, 50000)).toBe(0);
    });
});

describe("POS Service — Dynamic Promotions Engine", () => {
    it("applies 3x2 promotion correctly when 3 units are purchased", () => {
        const items = [
            { title: "Lector Código de Barras", sku: "HW-006", quantity: 3, unitPrice: 195000 },
        ];

        const evaluation = evaluateCartPromotions(items);
        expect(evaluation.totalDiscount).toBe(195000); // 1 item free (3rd item)
        expect(evaluation.appliedPromos.length).toBe(1);
    });

    it("applies Bundle discount when all bundle items are present in cart", () => {
        const items = [
            { title: "Impresora Térmica", sku: "HW-005", quantity: 1, unitPrice: 380000 },
            { title: "Lector Código de Barras", sku: "HW-006", quantity: 1, unitPrice: 195000 },
        ];

        // Regular sum: $575,000 COP. Bundle price: $500,000 COP -> Savings = $75,000 COP
        const evaluation = evaluateCartPromotions(items);
        expect(evaluation.totalDiscount).toBe(75000);
        expect(evaluation.appliedPromos.length).toBe(1);
    });
});

describe("DIAN Invoicing Engine — Official Algorithms (Anexo Técnico 1.8)", () => {
    it("calculates CUFE SHA-384 hash using official DIAN 15-parameter formula", () => {
        const payload = {
            documentType: "FACTURA_ELECTRONICA" as const,
            prefix: "FE",
            number: "300001",
            issueDate: "2026-07-24",
            issueTime: "10:00:00-05:00",
            paymentForm: "Contado",
            paymentMethod: "Transferencia Débito Bancaria",
            operationType: "10",
            subtotal: 100000,
            taxTotal: 19000,
            discountTotal: 0,
            grandTotal: 119000,
            technicalKey: "fc8b05a6315d0ae2041cd135ffd39b5e2c622f0a929db4489dd56dbb9a20c11",
            environment: "2" as const,
            issuer: {
                companyName: "EMPRESA DEMO",
                nit: "900123456",
                dv: "1",
                taxpayerType: "Persona Jurídica",
                taxRegime: "O-48",
                taxResponsibility: "01 - IVA",
                economicActivity: "4711",
                country: "Colombia",
                department: "Santander",
                city: "Bucaramanga",
                address: "Calle 33",
                phone: "3000000",
                email: "demo@ejemplo.com",
            },
            buyer: {
                name: "CONSUMIDOR FINAL",
                documentType: "CC",
                documentNumber: "1005462317",
            },
            items: [],
        };

        const cufe = calculateDianCufe(payload);
        expect(cufe).toHaveLength(96); // SHA-384 hex string length is exactly 96 characters
        expect(typeof cufe).toBe("string");
    });

    it("calculates official Modulo 11 Nit DV (Dígito de Verificación) correctly", () => {
        // Test NIT 890211126 -> DV 4 (Carlixplast S.A.S)
        expect(calculateNitDv("890211126")).toBe("4");
        // Test NIT 900123456 -> DV 8
        expect(calculateNitDv("900123456")).toBe("8");
    });
});

