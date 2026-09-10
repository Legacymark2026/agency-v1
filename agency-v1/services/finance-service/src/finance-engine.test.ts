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

import { describe, it, expect } from "vitest";
import {
  calculateInvoiceTotals,
  convertToStripeCents,
  calculateStripeFee,
  isValidStatusTransition,
  InvoiceItem,
  InvoiceStatus,
  VoucherDomain,
} from "./core/domain/finance.domain";
import { FinanceUseCases } from "./core/usecases/finance.usecases";
import { IFinancePersistencePort, IFinanceEventPublisherPort } from "./core/ports/finance.ports";


describe("Finance Service — Hexagonal Inbound & Outbound Ports (FinanceUseCases)", () => {
  it("orchestrates journal voucher creation with hash-chaining and event publishing", async () => {
    const savedVouchers: VoucherDomain[] = [];
    const publishedEvents: Array<{ topic: string; event: any }> = [];

    const mockRepo: IFinancePersistencePort = {
      findLastVoucher: async () => null, // Genesis
      saveVoucher: async (v) => {
        savedVouchers.push(v);
        return v;
      },
      findVouchersByCompany: async () => savedVouchers,
      saveInvoice: async (inv) => inv,
    };

    const mockEventBus: IFinanceEventPublisherPort = {
      publishAccountingEvent: async (topic, event) => {
        publishedEvents.push({ topic, event });
      },
    };

    const useCases = new FinanceUseCases(mockRepo, mockEventBus);
    const voucher = await useCases.createJournalVoucher({
      companyId: "comp-fin-1",
      documentType: "INGRESO",
      date: "2026-09-10",
      concept: "Pago de suscripción anual",
      lines: [
        { accountCode: "110505", accountName: "Caja General", debit: 500000, credit: 0 },
        { accountCode: "413501", accountName: "Ingresos Operacionales", debit: 0, credit: 500000 },
      ],
    });

    expect(voucher.voucherNumber).toBe("CC-000001");
    expect(voucher.totalDebit).toBe(500000);
    expect(voucher.totalCredit).toBe(500000);
    expect(voucher.hashSeal).toBeDefined();
    expect(voucher.hashSeal.length).toBe(64);
    expect(savedVouchers.length).toBe(1);
    expect(publishedEvents.length).toBe(1);
    expect(publishedEvents[0].topic).toBe("accounting.voucher.created");
  });

  it("verifies tamper detection in ledger chain via use cases", async () => {
    const v1 = VoucherDomain.create({
      companyId: "comp-chain-1",
      voucherNumber: "CC-000001",
      documentType: "INGRESO",
      date: "2026-09-01",
      concept: "Voucher 1",
      lines: [
        { accountCode: "110505", debit: 100, credit: 0 },
        { accountCode: "413501", debit: 0, credit: 100 },
      ],
    });

    const v2 = VoucherDomain.create({
      companyId: "comp-chain-1",
      voucherNumber: "CC-000002",
      documentType: "INGRESO",
      date: "2026-09-02",
      concept: "Voucher 2",
      previousHash: v1.hashSeal,
      lines: [
        { accountCode: "110505", debit: 200, credit: 0 },
        { accountCode: "413501", debit: 0, credit: 200 },
      ],
    });

    const mockRepo: IFinancePersistencePort = {
      findLastVoucher: async () => null,
      saveVoucher: async (v) => v,
      findVouchersByCompany: async () => [v1, v2],
      saveInvoice: async (i) => i,
    };

    const mockEventBus: IFinanceEventPublisherPort = {
      publishAccountingEvent: async () => {},
    };

    const useCases = new FinanceUseCases(mockRepo, mockEventBus);
    const integrityValid = await useCases.verifyLedgerIntegrity("comp-chain-1");
    expect(integrityValid.valid).toBe(true);
    expect(integrityValid.checkedCount).toBe(2);

    // Tamper with v1 amounts
    const tamperedV1 = new VoucherDomain(
      v1.id,
      v1.companyId,
      v1.voucherNumber,
      v1.documentType,
      v1.date,
      v1.concept,
      99999, // tampered
      v1.totalCredit,
      v1.previousHash,
      v1.hashSeal,
      v1.lines,
      v1.createdAt
    );

    mockRepo.findVouchersByCompany = async () => [tamperedV1, v2];
    const integrityInvalid = await useCases.verifyLedgerIntegrity("comp-chain-1");
    expect(integrityInvalid.valid).toBe(false);
  });
});

describe("Finance Service — Invoice Total Calculations", () => {
  it("calculates subtotal, 19% VAT tax, and total accurately", () => {
    const items: InvoiceItem[] = [
      { description: "Development Hours", quantity: 10, unitPrice: 50 }, // 500
      { description: "Hosting Setup", quantity: 1, unitPrice: 100 },      // 100
    ];

    const result = calculateInvoiceTotals(items, 0.19, 0);
    expect(result.subtotal).toBe(600);
    expect(result.discountAmount).toBe(0);
    expect(result.taxableAmount).toBe(600);
    expect(result.taxAmount).toBe(114); // 600 * 0.19 = 114
    expect(result.total).toBe(714);     // 600 + 114 = 714
  });

  it("applies promotional discount before calculating tax", () => {
    const items: InvoiceItem[] = [{ description: "Service Plan", quantity: 1, unitPrice: 1000 }];
    const result = calculateInvoiceTotals(items, 0.19, 10); // 10% discount

    expect(result.subtotal).toBe(1000);
    expect(result.discountAmount).toBe(100);
    expect(result.taxableAmount).toBe(900);
    expect(result.taxAmount).toBe(171); // 900 * 0.19 = 171
    expect(result.total).toBe(1071);    // 900 + 171 = 1071
  });
});

describe("Finance Service — Stripe Amount & Fee Helpers", () => {
  it("converts decimal currency amounts to Stripe integer cents", () => {
    expect(convertToStripeCents(19.99)).toBe(1999);
    expect(convertToStripeCents(100)).toBe(10000);
  });

  it("calculates Stripe fee and net payout correctly", () => {
    const { fee, net } = calculateStripeFee(100, 3.5, 0.3);
    expect(fee).toBe(3.8); // 3.5 + 0.3 = 3.8
    expect(net).toBe(96.2); // 100 - 3.8 = 96.2
  });
});

describe("Finance Service — Invoice Status State Machine", () => {
  it("allows valid invoice status transitions", () => {
    expect(isValidStatusTransition("DRAFT", "SENT")).toBe(true);
    expect(isValidStatusTransition("SENT", "PAID")).toBe(true);
    expect(isValidStatusTransition("SENT", "OVERDUE")).toBe(true);
    expect(isValidStatusTransition("OVERDUE", "PAID")).toBe(true);
  });

  it("blocks invalid invoice status transitions", () => {
    expect(isValidStatusTransition("DRAFT", "PAID")).toBe(false);
    expect(isValidStatusTransition("PAID", "SENT")).toBe(false);
    expect(isValidStatusTransition("CANCELLED", "SENT")).toBe(false);
  });
});
