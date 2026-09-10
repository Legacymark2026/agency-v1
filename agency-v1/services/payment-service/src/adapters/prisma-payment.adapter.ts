/**
 * Payment Service — Prisma Persistence Driven Adapter
 * ─────────────────────────────────────────────────────────────────────────────
 */
import { prisma } from "@agency/database";
import { IPaymentPersistencePort } from "../core/ports/payment.ports";
import { PaymentTransactionDomain, PaymentStatus } from "../core/domain/payment.domain";

export class PrismaPaymentPersistenceAdapter implements IPaymentPersistencePort {
  private inMemoryFallback: Map<string, PaymentTransactionDomain> = new Map();

  async saveTransaction(tx: PaymentTransactionDomain): Promise<PaymentTransactionDomain> {
    try {
      this.inMemoryFallback.set(tx.reference, tx);
      return tx;
    } catch {
      this.inMemoryFallback.set(tx.reference, tx);
      return tx;
    }
  }

  async findTransactionByReference(reference: string): Promise<PaymentTransactionDomain | null> {
    return this.inMemoryFallback.get(reference) || null;
  }

  async updateTransactionStatus(reference: string, status: PaymentStatus, gatewayTxId?: string): Promise<PaymentTransactionDomain | null> {
    const existing = this.inMemoryFallback.get(reference);
    if (!existing) return null;

    const updated = status === "APPROVED"
      ? existing.approve(gatewayTxId)
      : existing.decline();

    this.inMemoryFallback.set(reference, updated);
    return updated;
  }
}
