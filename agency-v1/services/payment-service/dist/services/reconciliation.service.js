"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReconciliationWorker = void 0;
/**
 * Auto-Reconciliation Engine
 * ─────────────────────────────────────────────────────────────────────────────
 * Detects abandoned or pending transactions where the webhook was missed,
 * queries the payment gateway directly, and synchronizes the state.
 */
const database_1 = require("@agency/database");
const prisma_payment_adapter_1 = require("../adapters/prisma-payment.adapter");
const gateway_registry_1 = require("../infrastructure/gateway-registry");
const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";
const events_1 = require("@agency/events");
const paymentEventBus = new events_1.EventBus(REDIS_URL, "payment-service");
const persistencePort = new prisma_payment_adapter_1.PrismaPaymentPersistenceAdapter();
class ReconciliationWorker {
    static async runReconciliationSweep() {
        console.log("[Reconciliation] Starting automatic sync sweep...");
        try {
            // Find transactions PENDING for more than 15 minutes but less than 24 hours
            const fifteenMinsAgo = new Date(Date.now() - 15 * 60000);
            const oneDayAgo = new Date(Date.now() - 24 * 3600000);
            const pendingTxs = await database_1.prisma.paymentTransaction.findMany({
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
                if (row.provider && row.gatewayTransactionId) {
                    try {
                        const gateway = gateway_registry_1.gatewayRegistry.get(row.provider);
                        actualStatus = await gateway.getTransactionStatus(row.gatewayTransactionId);
                    }
                    catch (e) {
                        console.warn(`[Reconciliation] Error getting status for ${row.provider}:`, e);
                    }
                }
                // If state changed to APPROVED, enforce transition and trigger Outbox/EventBus
                if (actualStatus === "APPROVED") {
                    await persistencePort.updateTransactionStatus(row.reference, "APPROVED", row.gatewayTransactionId);
                    await paymentEventBus.publish("order.completed", {
                        id: row.reference,
                        orderId: row.orderId || row.reference,
                        userId: row.companyId
                    });
                    reconciledCount++;
                    console.log(`[Reconciliation] Recovered lost APPROVED transaction: ${row.reference}`);
                }
                else if (actualStatus === "DECLINED") {
                    await persistencePort.updateTransactionStatus(row.reference, "DECLINED", row.gatewayTransactionId);
                    reconciledCount++;
                }
            }
            if (reconciledCount > 0) {
                console.log(`[Reconciliation] Successfully reconciled ${reconciledCount} transactions.`);
            }
        }
        catch (err) {
            console.warn("[Reconciliation] Sweep encountered an error:", err.message);
        }
    }
}
exports.ReconciliationWorker = ReconciliationWorker;
