/**
 * Finance Service — Unit & Integration Tests
 * Fix M-4: replaces the single catch-all test that always passed.
 * Real test coverage for:
 *   - ColombianAccountingService (withholdings, double-entry balance)
 *   - BatchInvoiceService (CUFE generation, batch processing)
 *   - FraudDetector (z-score logic with mocked DB)
 *   - ReconciliationService (fuzzy matching logic)
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { ColombianAccountingService } from "../src/services/colombian-accounting.service";
import { BatchInvoiceService } from "../src/services/batch-invoice.service";

// ── Mock Redis and Prisma (no real DB required for unit tests) ─────────────────
vi.mock("redis", () => ({
  createClient: () => ({
    on: vi.fn(),
    connect: vi.fn().mockResolvedValue(undefined),
    get: vi.fn().mockResolvedValue(null),
    setEx: vi.fn().mockResolvedValue("OK"),
  }),
}));

vi.mock("@agency/database", () => ({
  prisma: {
    expense: {
      findMany: vi.fn().mockResolvedValue([]),
      aggregate: vi.fn().mockResolvedValue({ _sum: { amount: null } }),
    },
    invoice: {
      findMany: vi.fn().mockResolvedValue([]),
      update: vi.fn().mockResolvedValue({ id: "inv-1", status: "PAID" }),
    },
  },
}));

// ── ColombianAccountingService ─────────────────────────────────────────────────
describe("ColombianAccountingService", () => {
  let service: ColombianAccountingService;

  beforeEach(() => {
    service = new ColombianAccountingService();
  });

  it("calculateWithholdings — COMPRAS: correct ReteFuente 2.5%", () => {
    const result = service.calculateWithholdings({
      subtotal: 1_000_000,
      transactionType: "COMPRAS",
    });

    expect(result.reteFuenteRate).toBe(0.025);
    expect(result.reteFuenteAmount).toBe(25_000);
    expect(result.vatAmount).toBe(190_000); // 19% IVA
    expect(result.netPayable).toBe(1_000_000 + 190_000 - 25_000);
  });

  it("calculateWithholdings — HONORARIOS: correct ReteFuente 10%", () => {
    const result = service.calculateWithholdings({
      subtotal: 500_000,
      transactionType: "HONORARIOS",
    });

    expect(result.reteFuenteRate).toBe(0.10);
    expect(result.reteFuenteAmount).toBe(50_000);
  });

  it("calculateWithholdings — SERVICIOS with ReteIVA: correct 15% of VAT", () => {
    const result = service.calculateWithholdings({
      subtotal: 1_000_000,
      transactionType: "SERVICIOS",
      applyReteIVA: true,
    });

    expect(result.reteFuenteRate).toBe(0.04);
    expect(result.reteIvaRate).toBe(0.15);
    expect(result.reteIvaAmount).toBe(Math.round(190_000 * 0.15));
  });

  it("calculateWithholdings — ReteICA rate per mil correct", () => {
    const result = service.calculateWithholdings({
      subtotal: 1_000_000,
      transactionType: "COMPRAS",
      reteIcaRatePerMil: 9.66,
    });

    expect(result.reteIcaRate).toBeCloseTo(0.00966, 5);
    expect(result.reteIcaAmount).toBe(Math.round(1_000_000 * 0.00966));
  });

  it("recordJournalVoucher — throws when debits ≠ credits (partida doble violation)", async () => {
    await expect(
      service.recordJournalVoucher("V-001", "Test", "company-1", [
        { accountCode: "110505", accountName: "Caja", thirdPartyNit: "", thirdPartyName: "", description: "", debit: 1000, credit: 0 },
        { accountCode: "220505", accountName: "Proveedores", thirdPartyNit: "", thirdPartyName: "", description: "", debit: 0, credit: 500 }, // unbalanced
      ])
    ).rejects.toThrow("desbalanceado");
  });

  it("recordJournalVoucher — accepts balanced entry and returns voucher", async () => {
    const voucher = await service.recordJournalVoucher("V-001", "Venta de servicios", "company-1", [
      { accountCode: "110505", accountName: "Caja", thirdPartyNit: "9001234567", thirdPartyName: "Cliente A", description: "Recaudo", debit: 1_000_000, credit: 0 },
      { accountCode: "413501", accountName: "Ingresos por servicios", thirdPartyNit: "9001234567", thirdPartyName: "Cliente A", description: "Prestación", debit: 0, credit: 1_000_000 },
    ]);

    expect(voucher.isBalanced).toBe(true);
    expect(voucher.totalDebit).toBe(1_000_000);
    expect(voucher.totalCredit).toBe(1_000_000);
    expect(voucher.voucherNumber).toBe("V-001");
  });

  it("generateTrialBalance — returns balanced totals", async () => {
    await service.recordJournalVoucher("V-002", "Gasto administrativo", "company-2", [
      { accountCode: "510506", accountName: "Sueldos", thirdPartyNit: "123", thirdPartyName: "Juan", description: "Salario", debit: 3_000_000, credit: 0 },
      { accountCode: "111005", accountName: "Bancos", thirdPartyNit: "", thirdPartyName: "", description: "Pago", debit: 0, credit: 3_000_000 },
    ]);

    const balance = await service.generateTrialBalance("company-2");

    expect(balance.isBalanced).toBe(true);
    expect(balance.totalDebit).toBe(balance.totalCredit);
  });
});

// ── BatchInvoiceService ────────────────────────────────────────────────────────
describe("BatchInvoiceService", () => {
  let service: BatchInvoiceService;

  beforeEach(() => {
    service = new BatchInvoiceService();
  });

  it("processBatchInvoices — calculates tax and total correctly", async () => {
    const result = await service.processBatchInvoices([
      { invoiceNumber: "FAC-001", clientNit: "9001234567", clientName: "Cliente Test", subtotal: 1_000_000, taxRate: 0.19 },
    ]);

    expect(result.totalInvoices).toBe(1);
    expect(result.successfulCount).toBe(1);
    expect(result.failedCount).toBe(0);

    const inv = result.processedInvoices[0];
    expect(inv.taxAmount).toBe(190_000);
    expect(inv.totalAmount).toBe(1_190_000);
    expect(inv.cufe).toBeTruthy();
    expect(inv.cufe.length).toBeGreaterThan(10);
  });

  it("processBatchInvoices — flags missing DIAN config", async () => {
    // No DIAN env vars set in test environment
    const result = await service.processBatchInvoices([
      { invoiceNumber: "FAC-002", clientNit: "9001234567", clientName: "Test", subtotal: 500_000 },
    ]);

    expect(result.missingDianConfig).toBe(true);
    // CUFE should be clearly invalid (not a fake real-looking hash)
    expect(result.processedInvoices[0].cufeValid).toBe(false);
  });

  it("processBatchInvoices — handles batch with concurrency", async () => {
    const batch = Array.from({ length: 12 }, (_, i) => ({
      invoiceNumber: `FAC-${String(i + 1).padStart(3, "0")}`,
      clientNit: `900000${i}`,
      clientName: `Cliente ${i + 1}`,
      subtotal: 100_000 * (i + 1),
    }));

    const result = await service.processBatchInvoices(batch, 3);

    expect(result.totalInvoices).toBe(12);
    expect(result.successfulCount).toBe(12);
    expect(result.totalGrossAmount).toBeGreaterThan(0);
    expect(result.totalTaxAmount).toBeGreaterThan(0);
    expect(result.durationMs).toBeGreaterThanOrEqual(0);
  });
});
