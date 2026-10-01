"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionalOutboxService = void 0;
/**
 * Transactional Outbox Engine & CDC Recovery Worker
 * ─────────────────────────────────────────────────────────────────────────────
 * Implements the Transactional Outbox Pattern to eliminate the Dual-Write Hazard
 * in financial transactions:
 * 1. Atomically persists the PaymentTransaction and the Outbox Event in PostgreSQL.
 * 2. Asynchronously dispatches events to the EventBus with At-Least-Once Delivery.
 * 3. Background poller recovers any failed or pending events (Dead-Letter Queue policy).
 */
const database_1 = require("@agency/database");
const event_bus_1 = require("../infrastructure/event-bus");
const crypto_1 = __importDefault(require("crypto"));
class TransactionalOutboxService {
    /**
     * Atomically writes a payment transaction and its domain event to PostgreSQL.
     */
    static async executeAtomicPaymentCommit(params) {
        const outboxId = `outbox_${Date.now()}_${crypto_1.default.randomBytes(4).toString("hex")}`;
        // 1. Transactional Write (ACID Guarantee)
        const [createdTx] = await database_1.prisma.$transaction([
            database_1.prisma.paymentTransaction.create({
                data: params.transactionData,
            }),
            database_1.prisma.paymentOutbox.create({
                data: {
                    id: outboxId,
                    companyId: params.transactionData.companyId,
                    aggregateType: "PAYMENT",
                    aggregateId: params.transactionData.reference,
                    eventType: params.eventType,
                    payload: params.eventPayload,
                    status: "PENDING",
                },
            }),
        ]);
        // 2. Optimistic Immediate Publish to EventBus
        try {
            await event_bus_1.paymentEventBus.publish(params.eventType, params.eventPayload);
            await database_1.prisma.paymentOutbox.update({
                where: { id: outboxId },
                data: {
                    status: "PUBLISHED",
                    publishedAt: new Date(),
                },
            });
        }
        catch (err) {
            console.warn(`[Outbox] Immediate publish failed for ${outboxId}. Left as PENDING for recovery worker:`, err.message);
        }
        return { transaction: createdTx, outboxId };
    }
    /**
     * Background recovery poller: sweeps PENDING outbox records and retries dispatch.
     */
    static async processPendingOutboxQueue(batchSize = 25) {
        try {
            const pendingEvents = await database_1.prisma.paymentOutbox.findMany({
                where: { status: "PENDING" },
                take: batchSize,
                orderBy: { createdAt: "asc" },
            });
            let processed = 0;
            for (const event of pendingEvents) {
                try {
                    await event_bus_1.paymentEventBus.publish(event.eventType, event.payload);
                    await database_1.prisma.paymentOutbox.update({
                        where: { id: event.id },
                        data: {
                            status: "PUBLISHED",
                            publishedAt: new Date(),
                        },
                    });
                    processed++;
                }
                catch (dispatchErr) {
                    const nextRetry = (event.retryCount || 0) + 1;
                    const isDeadLetter = nextRetry >= 5;
                    await database_1.prisma.paymentOutbox.update({
                        where: { id: event.id },
                        data: {
                            retryCount: nextRetry,
                            status: isDeadLetter ? "FAILED" : "PENDING",
                            error: dispatchErr.message,
                        },
                    });
                    if (isDeadLetter) {
                        console.error(`🚨 [Outbox DLQ] Event ${event.id} moved to Dead-Letter Queue after 5 failed retries.`);
                    }
                }
            }
            return processed;
        }
        catch (err) {
            console.warn("[Outbox Worker] Sweep warning:", err.message);
            return 0;
        }
    }
}
exports.TransactionalOutboxService = TransactionalOutboxService;
