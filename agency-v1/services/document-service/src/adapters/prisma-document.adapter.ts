/**
 * Document Service — Prisma Persistence Adapter
 * ─────────────────────────────────────────────────────────────────────────────
 */
import { prisma } from "@agency/database";
import { IDocumentRepositoryPort } from "../core/ports/document.ports";
import { DocumentDomain } from "../core/domain/document.domain";

export class PrismaDocumentAdapter implements IDocumentRepositoryPort {
  public async save(doc: DocumentDomain): Promise<DocumentDomain> {
    try {
      await (prisma as any).proposal.upsert({
        where: { id: doc.id },
        update: {
          title: doc.title,
          status: doc.status,
          content: doc.content,
          totalAmount: doc.totalAmount,
        },
        create: {
          id: doc.id,
          companyId: doc.companyId,
          title: doc.title,
          status: doc.status,
          content: doc.content,
          clientName: doc.clientName,
          totalAmount: doc.totalAmount,
        },
      });
    } catch {}
    return doc;
  }

  public async findById(id: string): Promise<DocumentDomain | null> {
    try {
      const row = await (prisma as any).proposal.findUnique({ where: { id } });
      if (!row) return null;
      return new DocumentDomain(
        row.id,
        row.companyId,
        row.title,
        "PROPOSAL",
        row.status || "DRAFT",
        row.clientName,
        row.totalAmount || 0,
        row.content || "",
        row.contentHash || "",
        row.signedBy,
        row.signedAt,
        row.createdAt
      );
    } catch {
      return null;
    }
  }

  public async findByCompany(companyId: string): Promise<DocumentDomain[]> {
    try {
      const rows = await (prisma as any).proposal.findMany({
        where: { companyId },
        orderBy: { createdAt: "desc" },
      });
      return rows.map((r: any) => new DocumentDomain(
        r.id,
        r.companyId,
        r.title,
        "PROPOSAL",
        r.status || "DRAFT",
        r.clientName,
        r.totalAmount || 0,
        r.content || "",
        "",
        r.signedBy,
        r.signedAt,
        r.createdAt
      ));
    } catch {
      return [];
    }
  }
}
