import { describe, it, expect } from "vitest";
import {
  computeVoucherHashSeal,
  verifyVoucherIntegrity,
  GENESIS_ACCOUNTING_HASH,
} from "./core/accounting/hash-chain";
import {
  calculateWithholdings,
  validateDoubleEntry,
  classifyPUCAccount,
  calculateDianDV,
  generateCUFE,
} from "./services/colombian-accounting.service";

describe("Colombian Accounting Engine (Hexagonal & Event Sourcing)", () => {
  it("computes deterministic SHA-256 hash seal for journal voucher", () => {
    const voucher = {
      previousHash: GENESIS_ACCOUNTING_HASH,
      companyId: "comp_test_01",
      voucherNumber: "CC-000001",
      date: "2026-09-03",
      totalDebit: 1190000,
      totalCredit: 1190000,
      lines: [
        { accountCode: "111005", debit: 1190000, credit: 0 },
        { accountCode: "413505", debit: 0, credit: 1000000 },
        { accountCode: "240801", debit: 0, credit: 190000 },
      ],
    };

    const seal1 = computeVoucherHashSeal(voucher);
    const seal2 = computeVoucherHashSeal(voucher);

    expect(seal1).toBeDefined();
    expect(seal1.length).toBe(64);
    expect(seal1).toBe(seal2); // Deterministic
  });

  it("detects tampering when amounts or accounts are altered", () => {
    const voucher = {
      previousHash: GENESIS_ACCOUNTING_HASH,
      companyId: "comp_test_01",
      voucherNumber: "CC-000001",
      date: "2026-09-03",
      totalDebit: 100000,
      totalCredit: 100000,
      lines: [
        { accountCode: "110505", debit: 100000, credit: 0 },
        { accountCode: "130505", debit: 0, credit: 100000 },
      ],
    };

    const validSeal = computeVoucherHashSeal(voucher);

    // Tamper: hacker modifies credit amount in database
    const tampered = {
      ...voucher,
      totalCredit: 999999,
      hashSeal: validSeal,
    };

    const result = verifyVoucherIntegrity(tampered);
    expect(result.isValid).toBe(false);
  });

  it("validates double-entry invariant (Partida Doble)", () => {
    const balanced = validateDoubleEntry("CC-001", "Venta", [
      { accountCode: "110505", debit: 500000, credit: 0 },
      { accountCode: "413501", debit: 0, credit: 500000 },
    ]);
    expect(balanced.isBalanced).toBe(true);

    const unbalanced = validateDoubleEntry("CC-002", "Venta desbalanceada", [
      { accountCode: "110505", debit: 500000, credit: 0 },
      { accountCode: "413501", debit: 0, credit: 450000 },
    ]);
    expect(unbalanced.isBalanced).toBe(false);
    expect(unbalanced.difference).toBe(50000);
  });

  it("calculates official DIAN NIT Verification Digit (Módulo 11)", () => {
    expect(calculateDianDV("860002964").dv).toBe(4); // Banco de Bogotá
    expect(calculateDianDV("890903938").dv).toBe(8); // Bancolombia
    expect(calculateDianDV("900123456").dv).toBeDefined();
  });

  it("calculates Colombian withholdings according to statutory rates", () => {
    const ret = calculateWithholdings({
      subtotal: 10000000,
      transactionType: "SERVICIOS",
      applyReteIVA: true,
      reteIcaRatePerMil: 9.66,
    });

    expect(ret.vatAmount).toBe(1900000);
    expect(ret.reteFuenteRate).toBe(0.04);
    expect(ret.reteFuenteAmount).toBe(400000); // 4%
    expect(ret.reteIvaAmount).toBe(285000); // 15% of IVA
    expect(ret.netPayable).toBeLessThan(ret.subtotal + ret.vatAmount);
  });

  it("classifies PUC accounts according to Decreto 2650", () => {
    expect(classifyPUCAccount("110505")).toEqual({ category: "ACTIVO", nature: "DEBITO" });
    expect(classifyPUCAccount("220505")).toEqual({ category: "PASIVO", nature: "CREDITO" });
    expect(classifyPUCAccount("310505")).toEqual({ category: "PATRIMONIO", nature: "CREDITO" });
    expect(classifyPUCAccount("413501")).toEqual({ category: "INGRESOS", nature: "CREDITO" });
    expect(classifyPUCAccount("510506")).toEqual({ category: "GASTOS", nature: "DEBITO" });
  });
});
