/**
 * services/auth-service/src/services/reconciliation.service.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Data Integrity Reconciliation Engine
 * Automatically aligns and verifies user record hashes between the legacy database
 * and the new decoupled auth database, logging results to OpenTelemetry.
 */
export declare class ReconciliationService {
    /**
     * Compares users in the decoupled Auth DB and the legacy Core DB,
     * reconciling any mismatched fields and reporting integrity metrics.
     */
    static runUserReconciliation(): Promise<{
        processed: number;
        aligned: number;
        fixed: number;
        errors: number;
    }>;
}
