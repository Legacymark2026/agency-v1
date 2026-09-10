/**
 * Prisma Adapter for Audit Security Service
 */
import { prisma } from "@agency/database";
import { IAuditRepositoryPort } from "../core/ports/audit.ports";
import { AuditRecordProps } from "../core/domain/audit.domain";

export class PrismaAuditAdapter implements IAuditRepositoryPort {
  async recordAuditLog(data: Omit<AuditRecordProps, "id">): Promise<AuditRecordProps> {
    return (prisma as any).auditSecurityLedger.create({ data });
  }

  async getLatestRecord(companyId: string): Promise<AuditRecordProps | null> {
    return (prisma as any).auditSecurityLedger.findFirst({
      where: { companyId },
      orderBy: { timestamp: "desc" },
    });
  }

  async listAuditRecords(companyId: string, limit: number = 100): Promise<AuditRecordProps[]> {
    return (prisma as any).auditSecurityLedger.findMany({
      where: { companyId },
      orderBy: { timestamp: "desc" },
      take: limit,
    });
  }

  async searchAuditRecords(params: {
    companyId: string;
    actorId?: string;
    resource?: string;
    fromDate?: Date;
    toDate?: Date;
  }): Promise<AuditRecordProps[]> {
    const where: any = { companyId: params.companyId };
    if (params.actorId) where.actorId = params.actorId;
    if (params.resource) where.resource = params.resource;
    if (params.fromDate || params.toDate) {
      where.timestamp = {};
      if (params.fromDate) where.timestamp.gte = params.fromDate;
      if (params.toDate) where.timestamp.lte = params.toDate;
    }

    return (prisma as any).auditSecurityLedger.findMany({
      where,
      orderBy: { timestamp: "desc" },
      take: 100,
    });
  }
}
