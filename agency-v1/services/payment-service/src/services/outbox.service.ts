/**
 * Transactional Outbox Engine & CDC Recovery Worker
 * ─────────────────────────────────────────────────────────────────────────────
 * Implements the Transactional Outbox Pattern to eliminate the Dual-Write Hazard
 * in financial transactions:
 * 1. Atomically persists the PaymentTransaction and the Outbox Event in PostgreSQL.
 * 2. Asynchronously dispatches events to the EventBus with At-Least-Once Delivery.
 * 3. Background poller recovers any failed or pending events (Dead-Letter Queue policy).
 */
import { prisma } from "@agency/database";
import { paymentEventBus } from "./payment.service";
import crypto from "crypto";

export interface OutboxEventRecord {
  id: string;
  aggregateType: string;
  aggregateId: string;
  eventType: string;
  payload: Record<string, any>;
  status: "PENDING" | "PUBLISHED" | "FAILED";
  retryCount: number;
}

export class TransactionalOutboxService {
  /**
   * Atomically writes a payment transaction and its domain event to PostgreSQL.
   */
  public static async executeAtomicPaymentCommit(params: {
    transactionData: any;
    eventType: string;
    eventPayload: Record<string, any>;
  }): Promise<{ transaction: any; outboxId: string }> {
    const outboxId = `outbox_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;

    // 1. Transactional Write (ACID Guarantee)
    const [createdTx] = await prisma.$transaction([
      (prisma as any).paymentTransaction.create({
        data: params.transactionData,
      }),
      (prisma as any).paymentOutbox.create({
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
      await paymentEventBus.publish(params.eventType, params.eventPayload);
      await (prisma as any).paymentOutbox.update({
        where: { id: outboxId },
        data: {
          status: "PUBLISHED",
          publishedAt: new Date(),
        },
      });
    } catch (err: any) {
      console.warn(`[Outbox] Immediate publish failed for ${outboxId}. Left as PENDING for recovery worker:`, err.message);
    }

    return { transaction: createdTx, outboxId };
  }

  /**
   * Background recovery poller: sweeps PENDING outbox records and retries dispatch.
   */
  public static async processPendingOutboxQueue(batchSize = 25): Promise<number> {
    try {
      const pendingEvents = await (prisma as any).paymentOutbox.findMany({
        where: { status: "PENDING" },
        take: batchSize,
        orderBy: { createdAt: "asc" },
      });

      let processed = 0;

      for (const event of pendingEvents) {
        try {
          await paymentEventBus.publish(event.eventType, event.payload);
          await (prisma as any).paymentOutbox.update({
            where: { id: event.id },
            data: {
              status: "PUBLISHED",
              publishedAt: new Date(),
            },
          });
          processed++;
        } catch (dispatchErr: any) {
          const nextRetry = (event.retryCount || 0) + 1;
          const isDeadLetter = nextRetry >= 5;

          await (prisma as any).paymentOutbox.update({
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
    } catch (err: any) {
      console.warn("[Outbox Worker] Sweep warning:", err.message);
      return 0;
    }
  }
}
