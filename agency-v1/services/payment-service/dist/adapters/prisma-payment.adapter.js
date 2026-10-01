"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrismaPaymentPersistenceAdapter = void 0;
/**
 * Payment Service — Prisma Persistence Driven Adapter
 * ─────────────────────────────────────────────────────────────────────────────
 * Real PostgreSQL persistence via Prisma ORM with in-memory fallback.
 */
const database_1 = require("@agency/database");
const payment_domain_1 = require("../core/domain/payment.domain");
class PrismaPaymentPersistenceAdapter {
    // Fallback for when DB is not yet migrated or unavailable
    inMemoryFallback = new Map();
    async saveTransaction(tx) {
        try {
            await database_1.prisma.paymentTransaction.upsert({
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
        }
        catch (err) {
            console.warn("[PrismaPaymentAdapter] DB write failed, using in-memory fallback:", err.message);
            this.inMemoryFallback.set(tx.reference, tx);
            return tx;
        }
    }
    async findTransactionByReference(reference) {
        try {
            const row = await database_1.prisma.paymentTransaction.findUnique({ where: { reference } });
            if (!row)
                return this.inMemoryFallback.get(reference) ?? null;
            return this.rowToDomain(row);
        }
        catch {
            return this.inMemoryFallback.get(reference) ?? null;
        }
    }
    async updateTransactionStatus(reference, status, gatewayTxId) {
        try {
            const row = await database_1.prisma.paymentTransaction.update({
                where: { reference },
                data: { status, gatewayTransactionId: gatewayTxId, updatedAt: new Date() },
            });
            return this.rowToDomain(row);
        }
        catch {
            const existing = this.inMemoryFallback.get(reference);
            if (!existing)
                return null;
            const updated = status === "APPROVED" ? existing.approve(gatewayTxId) : existing.decline();
            this.inMemoryFallback.set(reference, updated);
            return updated;
        }
    }
    rowToDomain(row) {
        return new payment_domain_1.PaymentTransactionDomain({
            id: row.id,
            companyId: row.companyId,
            reference: row.reference,
            amount: Number(row.amount),
            currency: row.currency,
            provider: row.provider,
            category: (row.category || "CUSTOM"),
            status: row.status,
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
exports.PrismaPaymentPersistenceAdapter = PrismaPaymentPersistenceAdapter;
