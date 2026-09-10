/**
 * Audit & Security Forensic Domain Models (Hexagonal 5.0 Core)
 * Pure domain logic: Cryptographic Hash Chaining (WORM), Tamper Detection, Habeas Data.
 */
import crypto from "crypto";

export const GENESIS_AUDIT_HASH = "0000000000000000000000000000000000000000000000000000000000000000";

export interface AuditRecordProps {
  id: string;
  companyId: string;
  actorId: string;
  actorEmail: string;
  actorRole: string;
  action: "CREATE" | "READ_SENSITIVE" | "UPDATE" | "DELETE" | "EXPORT" | "PERMISSION_CHANGE";
  resource: "INVOICE" | "ACCOUNTING" | "HR" | "USER" | "SETTINGS" | "POS";
  resourceId?: string;
  ipAddress?: string;
  userAgent?: string;
  details: any;
  hashSeal: string;
  previousHash?: string;
  timestamp: Date;
}

export class AuditLedgerEngine {
  /**
   * Generates deterministic SHA-256 seal for an audit entry chained to previousHash
   */
  static generateHashSeal(
    record: Omit<AuditRecordProps, "id" | "hashSeal">,
    previousHash: string = GENESIS_AUDIT_HASH
  ): string {
    const payload = JSON.stringify({
      companyId: record.companyId,
      actorId: record.actorId,
      actorEmail: record.actorEmail,
      actorRole: record.actorRole,
      action: record.action,
      resource: record.resource,
      resourceId: record.resourceId || null,
      details: record.details,
      timestamp: record.timestamp instanceof Date ? record.timestamp.toISOString() : record.timestamp,
      previousHash,
    });

    return crypto.createHash("sha256").update(payload).digest("hex");
  }

  /**
   * Validates integrity of an entire chain of audit records
   */
  static verifyChainIntegrity(records: AuditRecordProps[]): {
    isValid: boolean;
    brokenIndex?: number;
    expectedHash?: string;
    actualHash?: string;
  } {
    let prevHash = GENESIS_AUDIT_HASH;

    for (let i = 0; i < records.length; i++) {
      const rec = records[i];
      const recalculated = AuditLedgerEngine.generateHashSeal(rec, prevHash);

      if (recalculated !== rec.hashSeal) {
        return {
          isValid: false,
          brokenIndex: i,
          expectedHash: recalculated,
          actualHash: rec.hashSeal,
        };
      }
      prevHash = rec.hashSeal;
    }

    return { isValid: true };
  }
}
