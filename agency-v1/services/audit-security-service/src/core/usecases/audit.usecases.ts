/**
 * Audit Security UseCases Orchestrator (Hexagonal 5.0)
 */
import { AuditLedgerEngine, AuditRecordProps, GENESIS_AUDIT_HASH } from "../domain/audit.domain";
import { IAuditRepositoryPort, IAuditSecurityUseCases } from "../ports/audit.ports";

export class AuditSecurityUseCases implements IAuditSecurityUseCases {
  constructor(private readonly repo: IAuditRepositoryPort) {}

  async logEvent(params: {
    companyId: string;
    actorId: string;
    actorEmail: string;
    actorRole: string;
    action: "CREATE" | "READ_SENSITIVE" | "UPDATE" | "DELETE" | "EXPORT" | "PERMISSION_CHANGE";
    resource: "INVOICE" | "ACCOUNTING" | "HR" | "USER" | "SETTINGS" | "POS";
    resourceId?: string;
    ipAddress?: string;
    userAgent?: string;
    details?: any;
  }): Promise<AuditRecordProps> {
    const latest = await this.repo.getLatestRecord(params.companyId);
    const previousHash = latest ? latest.hashSeal : GENESIS_AUDIT_HASH;
    const timestamp = new Date();

    const recordToSeal: Omit<AuditRecordProps, "id" | "hashSeal"> = {
      companyId: params.companyId,
      actorId: params.actorId,
      actorEmail: params.actorEmail,
      actorRole: params.actorRole,
      action: params.action,
      resource: params.resource,
      resourceId: params.resourceId,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
      details: params.details || {},
      previousHash,
      timestamp,
    };

    const hashSeal = AuditLedgerEngine.generateHashSeal(recordToSeal, previousHash);

    const saved = await this.repo.recordAuditLog({
      ...recordToSeal,
      hashSeal,
    });

    return saved;
  }

  async verifyAuditIntegrity(companyId: string): Promise<{ isValid: boolean; totalVerified: number; brokenIndex?: number }> {
    const records = await this.repo.listAuditRecords(companyId, 500);
    // Sort oldest to newest for chain verification
    records.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    const result = AuditLedgerEngine.verifyChainIntegrity(records);
    return {
      isValid: result.isValid,
      totalVerified: records.length,
      brokenIndex: result.brokenIndex,
    };
  }
}
