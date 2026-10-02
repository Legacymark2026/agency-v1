/**
 * Payment Service — Prisma Persistence Driven Adapter
 * ─────────────────────────────────────────────────────────────────────────────
 * Real PostgreSQL persistence via Prisma ORM with in-memory fallback.
 */
import { prisma } from "@agency/database";
import { IPaymentPersistencePort } from "../core/ports/payment.ports";
import { PaymentTransactionDomain, PaymentStatus, PaymentProvider, PaymentCategory } from "../core/domain/payment.domain";

export class PrismaPaymentPersistenceAdapter implements IPaymentPersistencePort {
  // Fallback for when DB is not yet migrated or unavailable
  private readonly inMemoryFallback = new Map<string, PaymentTransactionDomain>();

  async saveTransaction(tx: PaymentTransactionDomain): Promise<PaymentTransactionDomain> {
    try {
      await (prisma as any).paymentTransaction.upsert({
        where: { reference: tx.reference },
        update: { status: tx.status, updatedAt: new Date() },
        create: {
          id: tx.id,
          companyId: tx.companyId,
          reference: tx.reference,
          amount: tx.amount,
          currency: tx.currency,
          provider: tx.provider,
          category: tx.category,
          status: tx.status,
          orderId: tx.orderId,
          invoiceId: tx.invoiceId,
          customerEmail: tx.customerEmail,
          metadata: tx.metadata ?? {},
        },
      });
      this.inMemoryFallback.set(tx.reference, tx);
      return tx;
    } catch (err: any) {
      console.warn("[PrismaPaymentAdapter] DB write failed, using in-memory fallback:", err.message);
      this.inMemoryFallback.set(tx.reference, tx);
      return tx;
    }
  }

  async findTransactionByReference(reference: string): Promise<PaymentTransactionDomain | null> {
    try {
      const row = await (prisma as any).paymentTransaction.findUnique({ where: { reference } });
      if (!row) return this.inMemoryFallback.get(reference) ?? null;
      return this.rowToDomain(row);
    } catch {
      return this.inMemoryFallback.get(reference) ?? null;
    }
  }

  async updateTransactionStatus(reference: string, status: PaymentStatus, gatewayTxId?: string): Promise<PaymentTransactionDomain | null> {
    try {
      const row = await (prisma as any).paymentTransaction.update({
        where: { reference },
        data: { status, gatewayTransactionId: gatewayTxId, updatedAt: new Date() },
      });
      return this.rowToDomain(row);
    } catch {
      const existing = this.inMemoryFallback.get(reference);
      if (!existing) return null;
      const updated = status === "APPROVED" ? existing.approve(gatewayTxId) : existing.decline();
      this.inMemoryFallback.set(reference, updated);
      return updated;
    }
  }

  private rowToDomain(row: any): PaymentTransactionDomain {
    return new (PaymentTransactionDomain as any)({ // use create for cleaner approach
      id: row.id,
      companyId: row.companyId,
      reference: row.reference,
      amount: Number(row.amount),
      currency: row.currency as "COP" | "USD" | "EUR",
      provider: row.provider as PaymentProvider,
      category: (row.category || "CUSTOM") as PaymentCategory,
      status: row.status as PaymentStatus,
      orderId: row.orderId ?? undefined,
      invoiceId: row.invoiceId ?? undefined,
      customerEmail: row.customerEmail ?? undefined,
      gatewayTransactionId: row.gatewayTransactionId ?? undefined,
      metadata: row.metadata ?? undefined,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }
}

