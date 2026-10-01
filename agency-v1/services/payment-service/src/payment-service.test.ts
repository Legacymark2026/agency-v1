/**
 * Payment Service — Hexagonal Unit Tests (Zero DB & Network Dependencies)
 * ─────────────────────────────────────────────────────────────────────────────
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { resetIdempotencyCache } from './middlewares/idempotency.middleware';
import { maskPAN, sanitizePayloadRecursively } from './middlewares/sanitizer.middleware';
import { WompiAdapter } from './adapters/wompi.adapter';
import { PaymentTransactionDomain } from "./core/domain/payment.domain";
import { PaymentUseCases } from "./core/usecases/payment.usecases";
import {
  IPaymentPersistencePort,
  IPaymentEventPublisherPort,
} from "./core/ports/payment.ports";

describe("Payment Service — Hexagonal Core Domain & UseCases", () => {
  const mockPersistence: IPaymentPersistencePort = {
    saveTransaction: vi.fn(async (tx) => tx),
    findTransactionByReference: vi.fn(async () => null),
    updateTransactionStatus: vi.fn(async () => null),
  };

  const mockPublisher: IPaymentEventPublisherPort = {
    publishPaymentCompleted: vi.fn(async () => {}),
    publishPaymentFailed: vi.fn(async () => {}),
  };

  const useCases = new PaymentUseCases(mockPersistence, mockPublisher);

  it("Domain: creates a valid PaymentTransaction entity", () => {
    const tx = PaymentTransactionDomain.create({
      companyId: "comp_123",
      reference: "REF-001",
      amount: 150000,
      currency: "COP",
      provider: "WOMPI",
    });

    expect(tx.reference).toBe("REF-001");
    expect(tx.amount).toBe(150000);
    expect(tx.status).toBe("PENDING");
  });

  it("Domain: throws if amount is zero or negative", () => {
    expect(() => {
      PaymentTransactionDomain.create({
        companyId: "comp_123",
        reference: "REF-002",
        amount: -50,
        currency: "USD",
        provider: "STRIPE",
      });
    }).toThrow("Payment amount must be greater than 0");
  });

  it("UseCases: processes a POS payment with automatic approval and event publication", async () => {
    const result = await useCases.processPOSPayment({
      companyId: "comp_123",
      amount: 45000,
      provider: "BOLD",
    });

    expect(result.status).toBe("APPROVED");
    expect(result.amount).toBe(45000);
    expect(mockPersistence.saveTransaction).toHaveBeenCalled();
    expect(mockPublisher.publishPaymentCompleted).toHaveBeenCalled();
  });

  it("UseCases: creates a checkout session reference and persists pending transaction", async () => {
    const session = await useCases.createCheckoutSession({
      companyId: "comp_123",
      amount: 250,
      currency: "USD",
      title: "Plan Pro Agency",
    });

    expect(session.reference).toBeDefined();
    expect(session.url).toBeDefined();
    expect(mockPersistence.saveTransaction).toHaveBeenCalled();
  });
});

describe('PCI-DSS PAN Masker', () => {
  it('masks a 16-digit card number correctly (BIN + Last 4)', () => {
    const masked = maskPAN('4111 1111 1111 1111');
    expect(masked).toBe('411111******1111');
  });

  it('redacts CVV fields from payload', () => {
    const sanitized = sanitizePayloadRecursively({ cvv: '123', amount: 100 });
    expect(sanitized.cvv).toBe('[REDACTED_SAD]');
    expect(sanitized.amount).toBe(100);
  });
});

describe('PaymentTransactionDomain Extra', () => {
  it('throws if amount is zero or negative', () => {
    expect(() => PaymentTransactionDomain.create({
      companyId: 'co1', reference: 'REF-1', amount: 0,
      currency: 'COP', provider: 'BOLD',
    })).toThrow('Payment amount must be greater than 0');
  });

  it('transitions to APPROVED state correctly', () => {
    const tx = PaymentTransactionDomain.create({
      companyId: 'co1', reference: 'REF-2', amount: 50000,
      currency: 'COP', provider: 'WOMPI',
    });
    const approved = tx.approve('gw-tx-123', 'APPR-001');
    expect(approved.status).toBe('APPROVED');
  });
});

describe('Wompi Webhook Security', () => {
  it('rejects payloads with invalid checksum', () => {
    process.env.WOMPI_EVENTS_SECRET = 'test-secret';
    const isValid = WompiAdapter.verifyWebhookSignature({
      data: { transaction: { id: 'txn_1', status: 'APPROVED', amount_in_cents: 100000 } },
      timestamp: 1700000000,
      signature: { checksum: 'deadbeef00000000000000000000000000000000000000000000000000000000' },
    });
    expect(isValid).toBe(false);
  });
});
