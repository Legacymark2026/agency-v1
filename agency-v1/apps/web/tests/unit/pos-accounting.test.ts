/**
 * POS Accounting Engine — Unit Tests
 * ─────────────────────────────────────────────────────────────────────────────
 * Pure unit tests verifying double-entry PUC accounting (Partida Doble)
 * for POS Sales, Cierre Z Cash Discrepancies, Split Payments, and Returns.
 */

import { describe, it, expect, vi } from "vitest";
import {
  createPosSaleAccountingEntry,
  createPosCierreZAdjustmentEntry,
  PosOrderAccountingInput,
} from "../../lib/pos/pos-accounting-engine";

// Mock the persistence action to isolate pure accounting line generation
vi.mock("@/modules/accounting/actions/journal-voucher.actions", () => ({
  recordJournalVoucherAction: vi.fn().mockResolvedValue({
    success: true,
    voucherNumber: "TEST-VOUCHER-001",
  }),
}));

describe("POS Accounting Engine — Sales Journal Entries", () => {
  it("generates perfectly balanced entries for a CASH sale with IVA 19% and Cost of Goods", async () => {
    const input: PosOrderAccountingInput = {
      orderId: "ord_001",
      receiptNo: "POS-001",
      paymentMethod: "CASH",
      subtotal: 100000,
      tax: 19000,
      total: 119000,
      taxType: "IVA",
      items: [
        {
          title: "Producto A",
          sku: "SKU-A",
          quantity: 2,
          unitPrice: 50000,
          costPrice: 25000,
        },
      ],
      customerNit: "900123456",
      customerName: "Cliente Test SAS",
    };

    const result = await createPosSaleAccountingEntry(input);

    expect(result.success).toBe(true);
    expect(result.lines.length).toBe(5); // 1 cash, 1 revenue, 1 vat, 1 cost, 1 inv

    // Verify Debits === Credits
    expect(result.totalDebit).toBe(result.totalCredit);
    expect(result.totalDebit).toBe(119000 + 50000); // Payment + Cost

    // Check individual accounts
    const cashLine = result.lines.find((l) => l.accountCode === "110505");
    expect(cashLine).toBeDefined();
    expect(cashLine?.debit).toBe(119000);
    expect(cashLine?.credit).toBe(0);

    const revenueLine = result.lines.find((l) => l.accountCode === "413501");
    expect(revenueLine).toBeDefined();
    expect(revenueLine?.credit).toBe(100000);
    expect(revenueLine?.debit).toBe(0);

    const vatLine = result.lines.find((l) => l.accountCode === "240801");
    expect(vatLine).toBeDefined();
    expect(vatLine?.credit).toBe(19000);
    expect(vatLine?.debit).toBe(0);

    const costLine = result.lines.find((l) => l.accountCode === "613501");
    expect(costLine).toBeDefined();
    expect(costLine?.debit).toBe(50000);

    const invLine = result.lines.find((l) => l.accountCode === "143501");
    expect(invLine).toBeDefined();
    expect(invLine?.credit).toBe(50000);
  });

  it("handles CARD_POS payment method crediting Bancos Adquirencia (111005)", async () => {
    const input: PosOrderAccountingInput = {
      orderId: "ord_002",
      receiptNo: "POS-002",
      paymentMethod: "CARD_POS",
      subtotal: 200000,
      tax: 38000,
      total: 238000,
      items: [{ title: "Item 1", quantity: 1, unitPrice: 200000, costPrice: 100000 }],
    };

    const result = await createPosSaleAccountingEntry(input);
    expect(result.success).toBe(true);
    expect(result.totalDebit).toBe(result.totalCredit);

    const bankLine = result.lines.find((l) => l.accountCode === "111005");
    expect(bankLine).toBeDefined();
    expect(bankLine?.debit).toBe(238000);
  });

  it("handles NEQUI_PSE payment method debiting Bancos Digitales (112005)", async () => {
    const input: PosOrderAccountingInput = {
      orderId: "ord_003",
      receiptNo: "POS-003",
      paymentMethod: "NEQUI_PSE",
      subtotal: 50000,
      tax: 0,
      total: 50000,
      items: [],
    };

    const result = await createPosSaleAccountingEntry(input);
    expect(result.success).toBe(true);
    expect(result.totalDebit).toBe(50000);
    expect(result.totalCredit).toBe(50000);

    const digitalLine = result.lines.find((l) => l.accountCode === "112005");
    expect(digitalLine).toBeDefined();
    expect(digitalLine?.debit).toBe(50000);
  });

  it("handles CREDIT (Fiado) payment method debiting Clientes Cartera POS (130505)", async () => {
    const input: PosOrderAccountingInput = {
      orderId: "ord_004",
      receiptNo: "POS-004",
      paymentMethod: "CREDIT",
      subtotal: 80000,
      tax: 0,
      total: 80000,
      items: [],
    };

    const result = await createPosSaleAccountingEntry(input);
    expect(result.success).toBe(true);
    expect(result.totalDebit).toBe(80000);
    expect(result.totalCredit).toBe(80000);

    const creditLine = result.lines.find((l) => l.accountCode === "130505");
    expect(creditLine).toBeDefined();
    expect(creditLine?.debit).toBe(80000);
  });

  it("handles SPLIT payments across cash, card, nequi, and credit accounts simultaneously", async () => {
    const input: PosOrderAccountingInput = {
      orderId: "ord_005",
      receiptNo: "POS-005",
      paymentMethod: "SPLIT",
      splitBreakdown: {
        cash: 50000,
        card: 100000,
        nequi: 30000,
        credit: 20000,
      },
      subtotal: 200000,
      tax: 0,
      total: 200000,
      items: [],
    };

    const result = await createPosSaleAccountingEntry(input);
    expect(result.success).toBe(true);
    expect(result.totalDebit).toBe(200000);
    expect(result.totalCredit).toBe(200000);

    expect(result.lines.find((l) => l.accountCode === "110505")?.debit).toBe(50000);
    expect(result.lines.find((l) => l.accountCode === "111005")?.debit).toBe(100000);
    expect(result.lines.find((l) => l.accountCode === "112005")?.debit).toBe(30000);
    expect(result.lines.find((l) => l.accountCode === "130505")?.debit).toBe(20000);
  });

  it("credits INC 8% (243601) and Restaurant Tip Liability (238030) when applicable", async () => {
    const input: PosOrderAccountingInput = {
      orderId: "ord_006",
      receiptNo: "POS-REST-001",
      paymentMethod: "CASH",
      subtotal: 100000,
      tax: 8000,
      taxType: "INC",
      tipAmount: 10000,
      total: 118000,
      items: [],
    };

    const result = await createPosSaleAccountingEntry(input);
    expect(result.success).toBe(true);
    expect(result.totalDebit).toBe(118000);
    expect(result.totalCredit).toBe(118000);

    // Verify INC account
    const incLine = result.lines.find((l) => l.accountCode === "243601");
    expect(incLine).toBeDefined();
    expect(incLine?.credit).toBe(8000);

    // Verify Tip liability account
    const tipLine = result.lines.find((l) => l.accountCode === "238030");
    expect(tipLine).toBeDefined();
    expect(tipLine?.credit).toBe(10000);
  });
});

describe("POS Accounting Engine — Cierre Z Discrepancies", () => {
  it("returns empty lines and 0 balance when cash is perfectly squared (diff = 0)", async () => {
    const result = await createPosCierreZAdjustmentEntry({
      sessionId: "session_001",
      registerName: "Caja 1",
      cashierName: "Cajero 1",
      expectedCash: 500000,
      actualCash: 500000,
      difference: 0,
    });

    expect(result.success).toBe(true);
    expect(result.lines.length).toBe(0);
    expect(result.totalDebit).toBe(0);
    expect(result.totalCredit).toBe(0);
  });

  it("creates adjustment for Faltante de Caja (difference < 0): Debit 136530 vs Credit 110505", async () => {
    const result = await createPosCierreZAdjustmentEntry({
      sessionId: "session_002",
      registerName: "Caja 1",
      cashierName: "Pedro Pérez",
      expectedCash: 500000,
      actualCash: 480000,
      difference: -20000,
    });

    expect(result.success).toBe(true);
    expect(result.lines.length).toBe(2);
    expect(result.totalDebit).toBe(20000);
    expect(result.totalCredit).toBe(20000);

    const receivable = result.lines.find((l) => l.accountCode === "136530");
    expect(receivable).toBeDefined();
    expect(receivable?.debit).toBe(20000);
    expect(receivable?.credit).toBe(0);

    const cash = result.lines.find((l) => l.accountCode === "110505");
    expect(cash).toBeDefined();
    expect(cash?.credit).toBe(20000);
    expect(cash?.debit).toBe(0);
  });

  it("creates adjustment for Sobrante de Caja (difference > 0): Debit 110505 vs Credit 429553", async () => {
    const result = await createPosCierreZAdjustmentEntry({
      sessionId: "session_003",
      registerName: "Caja 1",
      cashierName: "María Gómez",
      expectedCash: 500000,
      actualCash: 515000,
      difference: 15000,
    });

    expect(result.success).toBe(true);
    expect(result.lines.length).toBe(2);
    expect(result.totalDebit).toBe(15000);
    expect(result.totalCredit).toBe(15000);

    const cash = result.lines.find((l) => l.accountCode === "110505");
    expect(cash).toBeDefined();
    expect(cash?.debit).toBe(15000);
    expect(cash?.credit).toBe(0);

    const revenue = result.lines.find((l) => l.accountCode === "429553");
    expect(revenue).toBeDefined();
    expect(revenue?.credit).toBe(15000);
    expect(revenue?.debit).toBe(0);
  });
});
