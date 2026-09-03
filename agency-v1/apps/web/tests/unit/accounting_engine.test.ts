/**
 * Accounting Engine Service — Unit Tests
 * ─────────────────────────────────────────────────────────────────────────────
 * Pure unit tests for the stateless accounting engine functions.
 * Zero external I/O — tests only business logic.
 */

import { describe, it, expect } from "vitest";
import {
  calculateWithholdings,
  validateDoubleEntry,
  generateCUFE,
  classifyPUCAccount,
  calculateDianDV,
  calculatePayrollProvisions,
  generateChainHash,
} from "@/modules/accounting/services/accounting-engine.service";

// ── Withholding Calculations ─────────────────────────────────────────────────

describe("Colombian Withholding Calculations", () => {
  it("calculates ReteFuente at 2.5% for COMPRAS", () => {
    const result = calculateWithholdings({
      subtotal: 10_000_000,
      transactionType: "COMPRAS",
    });

    expect(result.reteFuenteRate).toBe(0.025);
    expect(result.reteFuenteAmount).toBe(250_000);
    expect(result.vatAmount).toBe(1_900_000); // 19% IVA
    expect(result.netPayable).toBe(10_000_000 + 1_900_000 - 250_000 - 0 - 96_600);
  });

  it("calculates ReteFuente at 4% for SERVICIOS", () => {
    const result = calculateWithholdings({
      subtotal: 5_000_000,
      transactionType: "SERVICIOS",
    });

    expect(result.reteFuenteRate).toBe(0.04);
    expect(result.reteFuenteAmount).toBe(200_000);
  });

  it("calculates ReteFuente at 10% for HONORARIOS", () => {
    const result = calculateWithholdings({
      subtotal: 8_000_000,
      transactionType: "HONORARIOS",
    });

    expect(result.reteFuenteRate).toBe(0.10);
    expect(result.reteFuenteAmount).toBe(800_000);
  });

  it("applies ReteIVA when flag is true (15% of IVA)", () => {
    const result = calculateWithholdings({
      subtotal: 10_000_000,
      transactionType: "COMPRAS",
      applyReteIVA: true,
    });

    expect(result.reteIvaRate).toBe(0.15);
    expect(result.reteIvaAmount).toBe(285_000); // 15% of 1,900,000
  });

  it("does NOT apply ReteIVA when flag is false", () => {
    const result = calculateWithholdings({
      subtotal: 10_000_000,
      transactionType: "COMPRAS",
      applyReteIVA: false,
    });

    expect(result.reteIvaRate).toBe(0);
    expect(result.reteIvaAmount).toBe(0);
  });

  it("calculates ReteICA at custom rate per mil", () => {
    const result = calculateWithholdings({
      subtotal: 10_000_000,
      transactionType: "COMPRAS",
      reteIcaRatePerMil: 11.04, // Bogotá services
    });

    expect(result.reteIcaRate).toBeCloseTo(0.01104);
    expect(result.reteIcaAmount).toBe(110_400);
  });

  it("handles zero subtotal gracefully", () => {
    const result = calculateWithholdings({
      subtotal: 0,
      transactionType: "COMPRAS",
    });

    expect(result.subtotal).toBe(0);
    expect(result.vatAmount).toBe(0);
    expect(result.netPayable).toBe(0);
  });
});

// ── Double-Entry Validation ──────────────────────────────────────────────────

describe("Double-Entry (Partida Doble) Validation", () => {
  it("validates balanced journal entry", () => {
    const result = validateDoubleEntry("CC-001", "Test voucher", [
      { accountCode: "110505", accountName: "Caja", debit: 1_000_000, credit: 0 },
      { accountCode: "413501", accountName: "Ingresos", debit: 0, credit: 1_000_000 },
    ]);

    expect(result.isBalanced).toBe(true);
    expect(result.totalDebit).toBe(1_000_000);
    expect(result.totalCredit).toBe(1_000_000);
    expect(result.difference).toBeLessThan(0.01);
    expect(result.hashSeal).toBeTruthy();
    expect(result.hashSeal.length).toBe(64); // SHA-256 hex
  });

  it("detects unbalanced journal entry", () => {
    const result = validateDoubleEntry("CC-002", "Unbalanced", [
      { accountCode: "110505", accountName: "Caja", debit: 1_000_000, credit: 0 },
      { accountCode: "413501", accountName: "Ingresos", debit: 0, credit: 500_000 },
    ]);

    expect(result.isBalanced).toBe(false);
    expect(result.difference).toBe(500_000);
  });

  it("generates unique hash for different vouchers", () => {
    const result1 = validateDoubleEntry("CC-001", "Voucher A", [
      { accountCode: "110505", accountName: "Caja", debit: 100, credit: 0 },
      { accountCode: "413501", accountName: "Ingresos", debit: 0, credit: 100 },
    ]);

    const result2 = validateDoubleEntry("CC-002", "Voucher B", [
      { accountCode: "110505", accountName: "Caja", debit: 200, credit: 0 },
      { accountCode: "413501", accountName: "Ingresos", debit: 0, credit: 200 },
    ]);

    expect(result1.hashSeal).not.toBe(result2.hashSeal);
  });
});

// ── PUC Account Classification ───────────────────────────────────────────────

describe("PUC Account Classification (Decreto 2650)", () => {
  it("classifies class 1 as ACTIVO / DEBITO", () => {
    expect(classifyPUCAccount("110505")).toEqual({ category: "ACTIVO", nature: "DEBITO" });
    expect(classifyPUCAccount("130505")).toEqual({ category: "ACTIVO", nature: "DEBITO" });
  });

  it("classifies class 2 as PASIVO / CREDITO", () => {
    expect(classifyPUCAccount("220505")).toEqual({ category: "PASIVO", nature: "CREDITO" });
    expect(classifyPUCAccount("236540")).toEqual({ category: "PASIVO", nature: "CREDITO" });
  });

  it("classifies class 3 as PATRIMONIO / CREDITO", () => {
    expect(classifyPUCAccount("310505")).toEqual({ category: "PATRIMONIO", nature: "CREDITO" });
  });

  it("classifies class 4 as INGRESOS / CREDITO", () => {
    expect(classifyPUCAccount("413501")).toEqual({ category: "INGRESOS", nature: "CREDITO" });
  });

  it("classifies class 5 as GASTOS / DEBITO", () => {
    expect(classifyPUCAccount("510506")).toEqual({ category: "GASTOS", nature: "DEBITO" });
  });

  it("classifies class 6 as COSTOS / DEBITO", () => {
    expect(classifyPUCAccount("613501")).toEqual({ category: "COSTOS", nature: "DEBITO" });
  });
});

// ── DIAN NIT Verification Digit ──────────────────────────────────────────────

describe("DIAN NIT Verification Digit (Módulo 11)", () => {
  it("calculates DV for known NIT: 860002964 → DV 4", () => {
    // Bancolombia's NIT
    const result = calculateDianDV("860002964");
    expect(result.dv).toBe(4);
    expect(result.formatted).toBe("860002964-4");
  });

  it("handles NIT with dots and dashes", () => {
    const result = calculateDianDV("900.123.456");
    expect(result.nit).toBe("900123456");
    expect(result.formatted).toContain("900123456-");
  });

  it("returns empty for empty input", () => {
    const result = calculateDianDV("");
    expect(result.nit).toBe("");
    expect(result.dv).toBe(0);
  });
});

// ── CUFE Generation ──────────────────────────────────────────────────────────

describe("DIAN CUFE Hash Generation", () => {
  it("returns invalid when DIAN config is missing", () => {
    const result = generateCUFE({
      invoiceNumber: "FEV-001",
      subtotal: 1_000_000,
      taxAmount: 190_000,
      clientNit: "900123456",
      dateStr: "2026-01-15T10:30:00Z",
    });

    expect(result.valid).toBe(false);
    expect(result.cufe).toContain("MISSING_DIAN_CONFIG");
  });

  it("generates valid SHA-384 CUFE when config is present", () => {
    const result = generateCUFE({
      invoiceNumber: "FEV-001",
      subtotal: 1_000_000,
      taxAmount: 190_000,
      clientNit: "900123456",
      dateStr: "2026-01-15T10:30:00Z",
      softwareNit: "902028722",
      technicalKey: "fc8eac422eba16e22ffd8c6f94b3f40a6e38162c",
    });

    expect(result.valid).toBe(true);
    expect(result.cufe.length).toBe(96); // SHA-384 hex
  });
});

// ── Payroll Provisions ───────────────────────────────────────────────────────

describe("Colombian Payroll Provisions (CST)", () => {
  it("calculates provisions for salary <= 2 SMLV (with transport allowance)", () => {
    const result = calculatePayrollProvisions(2_500_000);

    expect(result.transportAllowance).toBe(162_000); // Auxilio de transporte
    expect(result.cesantias).toBe(Math.round(2_662_000 * 0.0833));
    expect(result.primaServicios).toBe(Math.round(2_662_000 * 0.0833));
    expect(result.vacaciones).toBe(Math.round(2_500_000 * 0.0417));
    expect(result.pensionEmployer).toBe(300_000); // 12% of 2.5M
    expect(result.totalCompanyCost).toBeGreaterThan(2_500_000);
  });

  it("excludes transport allowance for salary > 2 SMLV", () => {
    const result = calculatePayrollProvisions(5_000_000);

    expect(result.transportAllowance).toBe(0);
    expect(result.totalAccrued).toBe(5_000_000);
  });
});

// ── Chain Hash Integrity ─────────────────────────────────────────────────────

describe("Append-Only Chain Hash Integrity", () => {
  it("generates hash without previous hash", () => {
    const hash = generateChainHash("abc123", null);
    expect(hash.length).toBe(64);
  });

  it("generates different hash when chained to previous", () => {
    const hash1 = generateChainHash("abc123", null);
    const hash2 = generateChainHash("abc123", "prev_hash_value");
    expect(hash1).not.toBe(hash2);
  });

  it("produces deterministic results", () => {
    const h1 = generateChainHash("abc123", "prev");
    const h2 = generateChainHash("abc123", "prev");
    expect(h1).toBe(h2);
  });
});
