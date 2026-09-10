/**
 * Payment Service — Hexagonal Unit Tests (Zero DB & Network Dependencies)
 * ─────────────────────────────────────────────────────────────────────────────
 */
import { describe, it, expect, vi } from "vitest";
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
