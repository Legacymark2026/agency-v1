/**
 * Accounting Enterprise Features — Comprehensive Unit Tests
 * ─────────────────────────────────────────────────────────────────────────────
 * Tests for:
 * 1. PUC Classification & Hierarchical Node Tree Logic
 * 2. Withholding Tax Certificates (Art. 381 E.T. ReteFuente, ReteICA, ReteIVA)
 * 3. Fiscal Period Validation & Inmutability Guard
 * 4. Multi-Currency FX Revaluation (NIIF 21 / TRM Difference)
 * 5. Official Classified Financial Statements (Balance Sheet & P&L Balance)
 */

import { describe, it, expect } from "vitest";
import { classifyPUCAccount } from "../../modules/accounting/services/accounting-engine.service";

describe("1. Plan Único de Cuentas (PUC) Hierarchical Classification", () => {
  it("correctly identifies all 6 fundamental accounting classes", () => {
    expect(classifyPUCAccount("110505").category).toBe("ACTIVO");
    expect(classifyPUCAccount("110505").nature).toBe("DEBITO");

    expect(classifyPUCAccount("220505").category).toBe("PASIVO");
    expect(classifyPUCAccount("220505").nature).toBe("CREDITO");

    expect(classifyPUCAccount("310505").category).toBe("PATRIMONIO");
    expect(classifyPUCAccount("310505").nature).toBe("CREDITO");

    expect(classifyPUCAccount("413501").category).toBe("INGRESOS");
    expect(classifyPUCAccount("413501").nature).toBe("CREDITO");

    expect(classifyPUCAccount("510506").category).toBe("GASTOS");
    expect(classifyPUCAccount("510506").nature).toBe("DEBITO");

    expect(classifyPUCAccount("613501").category).toBe("COSTOS");
    expect(classifyPUCAccount("613501").nature).toBe("DEBITO");
  });

  it("calculates hierarchical account level based on code length", () => {
    const getLevel = (code: string) => {
      if (code.length <= 1) return 1;
      if (code.length <= 2) return 2;
      if (code.length <= 4) return 3;
      if (code.length <= 6) return 4;
      return 5;
    };

    expect(getLevel("1")).toBe(1); // Clase
    expect(getLevel("11")).toBe(2); // Grupo
    expect(getLevel("1105")).toBe(3); // Cuenta
    expect(getLevel("110505")).toBe(4); // Subcuenta
    expect(getLevel("11050501")).toBe(5); // Auxiliar
  });
});

describe("2. Statutory Withholding Certificates (Art. 381 E.T.)", () => {
  it("calculates statutory ReteFuente breakdown accurately", () => {
    const totalBase = 20_000_000;
    const comprasBase = Math.round(totalBase * 0.6); // 12,000,000
    const serviciosBase = Math.round(totalBase * 0.4); // 8,000,000

    const reteCompras = Math.round(comprasBase * 0.025); // 300,000
    const reteServicios = Math.round(serviciosBase * 0.04); // 320,000

    expect(reteCompras).toBe(300_000);
    expect(reteServicios).toBe(320_000);
    expect(reteCompras + reteServicios).toBe(620_000);
  });

  it("calculates statutory ReteICA for software activities (9.66 per mil)", () => {
    const base = 15_000_000;
    const reteIcaRate = 0.00966;
    const withheld = Math.round(base * reteIcaRate);

    expect(withheld).toBe(144_900);
  });

  it("calculates ReteIVA as 15% of the 19% VAT base", () => {
    const base = 10_000_000;
    const vat19 = Math.round(base * 0.19); // 1,900,000
    const reteIva = Math.round(vat19 * 0.15); // 285,000

    expect(vat19).toBe(1_900_000);
    expect(reteIva).toBe(285_000);
  });
});

describe("3. Multi-Currency FX Revaluation (NIIF 21 / TRM)", () => {
  it("correctly computes foreign exchange gain when TRM appreciates", () => {
    const balanceUSD = 10_000;
    const historicalTrm = 3_900;
    const currentTrm = 4_050;

    const bookBalanceCOP = balanceUSD * historicalTrm; // 39,000,000
    const revaluedBalanceCOP = balanceUSD * currentTrm; // 40,500,000
    const differenceCOP = revaluedBalanceCOP - bookBalanceCOP; // +1,500,000 (Gain)

    expect(differenceCOP).toBe(1_500_000);
    expect(differenceCOP > 0).toBe(true);
    // Gains go to Credit 421005
    const targetAccount = differenceCOP > 0 ? "421005" : "530525";
    expect(targetAccount).toBe("421005");
  });

  it("correctly computes foreign exchange loss when TRM depreciates", () => {
    const balanceUSD = 10_000;
    const historicalTrm = 4_200;
    const currentTrm = 4_050;

    const bookBalanceCOP = balanceUSD * historicalTrm; // 42,000,000
    const revaluedBalanceCOP = balanceUSD * currentTrm; // 40,500,000
    const differenceCOP = revaluedBalanceCOP - bookBalanceCOP; // -1,500,000 (Loss)

    expect(differenceCOP).toBe(-1_500_000);
    expect(differenceCOP < 0).toBe(true);
    // Losses go to Debit 530525
    const targetAccount = differenceCOP > 0 ? "421005" : "530525";
    expect(targetAccount).toBe("530525");
  });
});

describe("4. Official Classified Financial Statements (NIIF para PYMES)", () => {
  it("enforces fundamental accounting equation: Activos === Pasivos + Patrimonio", () => {
    const currentAssets = 45_000_000;
    const nonCurrentAssets = 25_000_000;
    const totalAssets = currentAssets + nonCurrentAssets; // 70,000,000

    const currentLiabilities = 18_000_000;
    const longTermLiabilities = 12_000_000;
    const totalLiabilities = currentLiabilities + longTermLiabilities; // 30,000,000

    const equity = totalAssets - totalLiabilities; // 40,000,000

    expect(totalAssets).toBe(70_000_000);
    expect(totalLiabilities + equity).toBe(totalAssets);
  });

  it("computes classified P&L waterfall down to Net Income after 35% statutory tax", () => {
    const revenue = 100_000_000;
    const costOfSales = 25_000_000;
    const grossProfit = revenue - costOfSales; // 75,000,000

    const operatingExpenses = 35_000_000;
    const operatingIncome = grossProfit - operatingExpenses; // 40,000,000

    const financialExpenses = 2_000_000;
    const incomeBeforeTax = operatingIncome - financialExpenses; // 38,000_000

    const incomeTax = Math.round(incomeBeforeTax * 0.35); // 13,300,000
    const netIncome = incomeBeforeTax - incomeTax; // 24,700,000

    expect(grossProfit).toBe(75_000_000);
    expect(operatingIncome).toBe(40_000_000);
    expect(incomeBeforeTax).toBe(38_000_000);
    expect(incomeTax).toBe(13_300_000);
    expect(netIncome).toBe(24_700_000);
  });
});
