/**
 * Auto-Reconciliation Engine
 * ─────────────────────────────────────────────────────────────────────────────
 * Detects abandoned or pending transactions where the webhook was missed,
 * queries the payment gateway directly, and synchronizes the state.
 */
import { prisma } from "@agency/database";
import { PaymentTransactionDomain } from "../core/domain/payment.domain";
import { PrismaPaymentPersistenceAdapter } from "../adapters/prisma-payment.adapter";
import { StripeAdapter } from "../adapters/stripe.adapter";
import { WompiAdapter } from "../adapters/wompi.adapter";

// Ensure this file uses the correct pubsub or outbox service in the future.
// In the prompt, paymentEventBus from "../infrastructure/event-bus" is used,
// but looking at index.ts, we have EventBus from "@agency/events". 
// Since we don't have the full tree, I will use a dummy or create the import from what's given.
// Wait, index.ts uses:
// import { EventBus } from "@agency/events";
// const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";
// const eventBus = new EventBus(REDIS_URL, "payment-service");
// So we can do the same, or just mock paymentEventBus if it doesn't exist.
// Based on the user instructions, I'll put exact code.

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";
import { EventBus } from "@agency/events";
const paymentEventBus = new EventBus(REDIS_URL, "payment-service");

const persistencePort = new PrismaPaymentPersistenceAdapter();

export class ReconciliationWorker {
  public static async runReconciliationSweep() {
    console.log("[Reconciliation] Starting automatic sync sweep...");
    try {
      // Find transactions PENDING for more than 15 minutes but less than 24 hours
      const fifteenMinsAgo = new Date(Date.now() - 15 * 60000);
      const oneDayAgo = new Date(Date.now() - 24 * 3600000);

      const pendingTxs = await (prisma as any).paymentTransaction.findMany({
        where: {
          status: "PENDING",
          createdAt: { lt: fifteenMinsAgo, gt: oneDayAgo }
        },
        take: 50
      });

      let reconciledCount = 0;

      for (const row of pendingTxs) {
        let actualStatus = "PENDING";

        // Poll gateway
        if (row.provider === "STRIPE" && row.gatewayTransactionId) {
           actualStatus = await StripeAdapter.getSessionStatus(row.gatewayTransactionId);
        } else if (row.provider === "WOMPI" && row.gatewayTransactionId) {
           actualStatus = await WompiAdapter.getTransactionStatus(row.gatewayTransactionId);
        }
        
        // If state changed to APPROVED, enforce transition and trigger Outbox/EventBus
        if (actualStatus === "APPROVED") {
           await persistencePort.updateTransactionStatus(row.reference, "APPROVED", row.gatewayTransactionId);
           await paymentEventBus.publish("payment.succeeded", {
              reference: row.reference,
              amount: Number(row.amount),
              currency: row.currency,
              companyId: row.companyId,
              provider: row.provider,
              timestamp: new Date().toISOString()
           });
           reconciledCount++;
           console.log(`[Reconciliation] Recovered lost APPROVED transaction: ${row.reference}`);
        } else if (actualStatus === "DECLINED") {
           await persistencePort.updateTransactionStatus(row.reference, "DECLINED", row.gatewayTransactionId);
           reconciledCount++;
        }
      }

      if (reconciledCount > 0) {
        console.log(`[Reconciliation] Successfully reconciled ${reconciledCount} transactions.`);
      }
    } catch (err: any) {
      console.warn("[Reconciliation] Sweep encountered an error:", err.message);
    }
  }
}
