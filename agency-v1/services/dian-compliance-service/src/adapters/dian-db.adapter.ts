/**
 * Prisma Adapter for DIAN Compliance Service
 */
import { prisma } from "@agency/database";
import { IDianRepositoryPort } from "../core/ports/dian.ports";
import { DianDocumentProps, DianResolutionProps } from "../core/domain/dian.domain";

export class PrismaDianAdapter implements IDianRepositoryPort {
  async saveDocument(data: Omit<DianDocumentProps, "id">): Promise<DianDocumentProps> {
    return (prisma as any).dianDocument.create({ data });
  }

  async findDocumentById(id: string): Promise<DianDocumentProps | null> {
    return (prisma as any).dianDocument.findUnique({ where: { id } });
  }

  async findDocumentByNumber(companyId: string, documentNumber: string): Promise<DianDocumentProps | null> {
    return (prisma as any).dianDocument.findFirst({ where: { companyId, documentNumber } });
  }

  async listDocuments(companyId: string, status?: string): Promise<DianDocumentProps[]> {
    const where: any = { companyId };
    if (status) where.dianStatus = status;
    return (prisma as any).dianDocument.findMany({
      where,
      orderBy: { issuedAt: "desc" },
      take: 100,
    });
  }

  async updateDocumentStatus(id: string, status: string, dianResponse?: any): Promise<DianDocumentProps> {
    return (prisma as any).dianDocument.update({
      where: { id },
      data: { dianStatus: status, dianResponse },
    });
  }

  async getActiveResolution(companyId: string, prefix: string): Promise<DianResolutionProps | null> {
    return (prisma as any).dianResolution.findFirst({
      where: { companyId, prefix, isActive: true },
    });
  }

  async listResolutions(companyId: string): Promise<DianResolutionProps[]> {
    return (prisma as any).dianResolution.findMany({
      where: { companyId },
      orderBy: { validTo: "desc" },
    });
  }

  async createResolution(data: Omit<DianResolutionProps, "id">): Promise<DianResolutionProps> {
    return (prisma as any).dianResolution.create({ data });
  }

  async incrementResolutionNumber(id: string): Promise<number> {
    const updated = await (prisma as any).dianResolution.update({
      where: { id },
      data: { currentNumber: { increment: 1 } },
      select: { currentNumber: true },
    });
    return updated.currentNumber;
  }
}
