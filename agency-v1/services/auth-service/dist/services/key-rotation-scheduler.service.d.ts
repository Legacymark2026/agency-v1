/**
 * Automated Cryptographic Key Rotation Scheduler & Lifecycle Policy Engine
 * ─────────────────────────────────────────────────────────────────────────────
 * Scans encryption keys across tenants and rotates keys older than 90 days,
 * archiving previous key versions for backward-compatible decryption.
 */
export interface TenantKeyConfig {
    tenantId: string;
    keyAlias: string;
    masterKeyHash: string;
    keyStatus: "ACTIVE" | "ROTATED" | "REVOKED";
    algorithm: "AES-256-GCM";
    createdAt: string;
    lastRotatedAt: string;
}
export interface KeyAuditReport {
    scannedCount: number;
    rotatedCount: number;
    compliantCount: number;
    rotationResults: Array<{
        tenantId: string;
        keyAlias: string;
        action: "ROTATED" | "COMPLIANT";
        lastRotatedAt: string;
    }>;
}
export declare class KeyRotationSchedulerService {
    private maxKeyAgeDays;
    private tenantKeys;
    provisionTenantKey(tenantId: string, keyAlias: string): TenantKeyConfig;
    rotateTenantKey(tenantId: string): TenantKeyConfig;
    /**
     * Scans and executes automatic rotation for keys exceeding the maximum policy age.
     */
    runScheduledRotation(tenantIds: string[]): KeyAuditReport;
}
export declare const keyRotationScheduler: KeyRotationSchedulerService;
