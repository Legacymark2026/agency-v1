/**
 * Ports for Audit Security Service (Hexagonal 5.0)
 */
import { AuditRecordProps } from "../domain/audit.domain";

export interface IAuditRepositoryPort {
  recordAuditLog(data: Omit<AuditRecordProps, "id">): Promise<AuditRecordProps>;
  getLatestRecord(companyId: string): Promise<AuditRecordProps | null>;
  listAuditRecords(companyId: string, limit?: number): Promise<AuditRecordProps[]>;
  searchAuditRecords(params: { companyId: string; actorId?: string; resource?: string; fromDate?: Date; toDate?: Date }): Promise<AuditRecordProps[]>;
}

export interface IAuditSecurityUseCases {
  logEvent(params: {
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
  }): Promise<AuditRecordProps>;

  verifyAuditIntegrity(companyId: string): Promise<{ isValid: boolean; totalVerified: number; brokenIndex?: number }>;
}
