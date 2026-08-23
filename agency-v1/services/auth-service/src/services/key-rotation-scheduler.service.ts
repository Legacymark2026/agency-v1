/**
 * Automated Cryptographic Key Rotation Scheduler & Lifecycle Policy Engine
 * ─────────────────────────────────────────────────────────────────────────────
 * Scans encryption keys across tenants and rotates keys older than 90 days,
 * archiving previous key versions for backward-compatible decryption.
 */

import { cmekVaultService, TenantKeyConfig } from "../../../admin-service/src/services/cmek-vault.service";

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

export class KeyRotationSchedulerService {
  private maxKeyAgeDays = 90;

  /**
   * Scans and executes automatic rotation for keys exceeding the maximum policy age.
   */
  public runScheduledRotation(tenantIds: string[]): KeyAuditReport {
    const report: KeyAuditReport = {
      scannedCount: tenantIds.length,
      rotatedCount: 0,
      compliantCount: 0,
      rotationResults: [],
    };

    const now = Date.now();
    const maxAgeMs = this.maxKeyAgeDays * 24 * 60 * 60 * 1000;

    for (const tenantId of tenantIds) {
      try {
        // Ensure tenant has an active key
        const keyConfig: TenantKeyConfig = cmekVaultService.provisionTenantKey(tenantId, `cmek_policy_${tenantId}`);
        const lastRotatedTime = new Date(keyConfig.lastRotatedAt).getTime();
        const isExpired = now - lastRotatedTime > maxAgeMs;

        if (isExpired) {
          const rotated = cmekVaultService.rotateTenantKey(tenantId);
          report.rotatedCount++;
          report.rotationResults.push({
            tenantId,
            keyAlias: rotated.keyAlias,
            action: "ROTATED",
            lastRotatedAt: rotated.lastRotatedAt,
          });
        } else {
          report.compliantCount++;
          report.rotationResults.push({
            tenantId,
            keyAlias: keyConfig.keyAlias,
            action: "COMPLIANT",
            lastRotatedAt: keyConfig.lastRotatedAt,
          });
        }
      } catch (err: any) {
        console.error(`[KeyRotation] Error evaluating tenant ${tenantId}:`, err.message);
      }
    }

    return report;
  }
}

export const keyRotationScheduler = new KeyRotationSchedulerService();
