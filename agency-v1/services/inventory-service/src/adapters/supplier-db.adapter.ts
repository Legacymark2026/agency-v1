/**
 * PostgreSQL Prisma Persistence Adapter for Supplier Catalog (Hexagonal Driven Adapter)
 */
import { prisma } from "@agency/database";
import {
  ISupplierRepositoryPort,
  SupplierFilterCriteria,
} from "../core/ports/supplier.ports";
import {
  SupplierProps,
  SupplierDocumentProps,
  SupplierCategory,
  SupplierStatus,
  DocumentType,
  DocumentStatus,
} from "../core/domain/supplier.domain";

export class PrismaSupplierAdapter implements ISupplierRepositoryPort {
  private mapToDomain(record: any): SupplierProps {
    return {
      id: record.id,
      companyId: record.companyId,
      legal: {
        name: record.name,
        legalName: record.legalName,
        taxId: record.taxId,
        taxType: record.taxType,
        country: record.country,
        address: record.address,
        city: record.city,
      },
      contact: {
        contactName: record.contactName,
        contactEmail: record.contactEmail,
        contactPhone: record.contactPhone,
      },
      commercial: {
        paymentTermsDays: record.paymentTermsDays,
        creditLimit: record.creditLimit,
        currency: record.currency,
        discountRatePct: record.discountRatePct,
        bankName: record.bankName,
        bankAccountType: record.bankAccountType,
        bankAccountNumber: record.bankAccountNumber,
        bankAccountHolder: record.bankAccountHolder,
      },
      category: record.category as SupplierCategory,
      status: record.status as SupplierStatus,
      ratingScore: record.ratingScore,
      notes: record.notes,
      customFields: record.customFields || {},
      documents: record.documents ? record.documents.map((d: any) => this.mapDocToDomain(d)) : [],
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }

  private mapDocToDomain(doc: any): SupplierDocumentProps {
    return {
      id: doc.id,
      supplierId: doc.supplierId,
      companyId: doc.companyId,
      documentType: doc.documentType as DocumentType,
      title: doc.title,
      fileUrl: doc.fileUrl,
      fileKey: doc.fileKey,
      fileSize: doc.fileSize,
      mimeType: doc.mimeType,
      issueDate: doc.issueDate,
      expiryDate: doc.expiryDate,
      isVerified: doc.isVerified,
      verifiedAt: doc.verifiedAt,
      verifiedBy: doc.verifiedBy,
      status: doc.status as DocumentStatus,
      notes: doc.notes,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
  }

  async createSupplier(data: SupplierProps): Promise<SupplierProps> {
    const record = await (prisma as any).supplier.create({
      data: {
        id: data.id,
        companyId: data.companyId,
        name: data.legal.name,
        legalName: data.legal.legalName,
        taxId: data.legal.taxId,
        taxType: data.legal.taxType,
        category: data.category,
        contactName: data.contact.contactName,
        contactEmail: data.contact.contactEmail,
        contactPhone: data.contact.contactPhone,
        address: data.legal.address,
        city: data.legal.city,
        country: data.legal.country,
        paymentTermsDays: data.commercial.paymentTermsDays,
        creditLimit: data.commercial.creditLimit,
        currency: data.commercial.currency,
        bankName: data.commercial.bankName,
        bankAccountType: data.commercial.bankAccountType,
        bankAccountNumber: data.commercial.bankAccountNumber,
        bankAccountHolder: data.commercial.bankAccountHolder,
        discountRatePct: data.commercial.discountRatePct,
        status: data.status,
        ratingScore: data.ratingScore,
        notes: data.notes,
        customFields: data.customFields || {},
      },
    });

    return this.mapToDomain(record);
  }

  async updateSupplier(id: string, companyId: string, data: Partial<SupplierProps>): Promise<SupplierProps> {
    const updatePayload: any = { updatedAt: new Date() };

    if (data.legal) {
      if (data.legal.name) updatePayload.name = data.legal.name;
      if (data.legal.legalName !== undefined) updatePayload.legalName = data.legal.legalName;
      if (data.legal.taxId) updatePayload.taxId = data.legal.taxId;
      if (data.legal.taxType) updatePayload.taxType = data.legal.taxType;
      if (data.legal.address !== undefined) updatePayload.address = data.legal.address;
      if (data.legal.city !== undefined) updatePayload.city = data.legal.city;
      if (data.legal.country) updatePayload.country = data.legal.country;
    }

    if (data.contact) {
      if (data.contact.contactName !== undefined) updatePayload.contactName = data.contact.contactName;
      if (data.contact.contactEmail !== undefined) updatePayload.contactEmail = data.contact.contactEmail;
      if (data.contact.contactPhone !== undefined) updatePayload.contactPhone = data.contact.contactPhone;
    }

    if (data.commercial) {
      if (data.commercial.paymentTermsDays !== undefined) updatePayload.paymentTermsDays = data.commercial.paymentTermsDays;
      if (data.commercial.creditLimit !== undefined) updatePayload.creditLimit = data.commercial.creditLimit;
      if (data.commercial.currency) updatePayload.currency = data.commercial.currency;
      if (data.commercial.discountRatePct !== undefined) updatePayload.discountRatePct = data.commercial.discountRatePct;
      if (data.commercial.bankName !== undefined) updatePayload.bankName = data.commercial.bankName;
      if (data.commercial.bankAccountType !== undefined) updatePayload.bankAccountType = data.commercial.bankAccountType;
      if (data.commercial.bankAccountNumber !== undefined) updatePayload.bankAccountNumber = data.commercial.bankAccountNumber;
      if (data.commercial.bankAccountHolder !== undefined) updatePayload.bankAccountHolder = data.commercial.bankAccountHolder;
    }

    if (data.category) updatePayload.category = data.category;
    if (data.status) updatePayload.status = data.status;
    if (data.ratingScore !== undefined) updatePayload.ratingScore = data.ratingScore;
    if (data.notes !== undefined) updatePayload.notes = data.notes;
    if (data.customFields !== undefined) updatePayload.customFields = data.customFields;

    const record = await (prisma as any).supplier.update({
      where: { id, companyId },
      data: updatePayload,
    });

    return this.mapToDomain(record);
  }

  async findSupplierById(id: string, companyId: string): Promise<SupplierProps | null> {
    const record = await (prisma as any).supplier.findFirst({
      where: { id, companyId },
      include: { documents: true },
    });
    return record ? this.mapToDomain(record) : null;
  }

  async findSupplierByTaxId(taxId: string, companyId: string): Promise<SupplierProps | null> {
    const record = await (prisma as any).supplier.findUnique({
      where: { companyId_taxId: { companyId, taxId } },
    });
    return record ? this.mapToDomain(record) : null;
  }

  async listSuppliers(criteria: SupplierFilterCriteria): Promise<{ items: SupplierProps[]; total: number }> {
    const where: any = { companyId: criteria.companyId };

    if (criteria.category) {
      where.category = criteria.category;
    }

    if (criteria.status) {
      where.status = criteria.status;
    }

    if (criteria.search) {
      const q = criteria.search.trim();
      where.OR = [
        { name: { contains: q, mode: "insensitive" } },
        { legalName: { contains: q, mode: "insensitive" } },
        { taxId: { contains: q, mode: "insensitive" } },
        { contactEmail: { contains: q, mode: "insensitive" } },
        { contactName: { contains: q, mode: "insensitive" } },
      ];
    }

    const [total, records] = await Promise.all([
      (prisma as any).supplier.count({ where }),
      (prisma as any).supplier.findMany({
        where,
        include: { documents: true },
        orderBy: { name: "asc" },
        take: criteria.limit || 50,
        skip: criteria.offset || 0,
      }),
    ]);

    return {
      total,
      items: records.map((r: any) => this.mapToDomain(r)),
    };
  }

  async deleteSupplier(id: string, companyId: string): Promise<boolean> {
    await (prisma as any).supplier.delete({
      where: { id, companyId },
    });
    return true;
  }

  // ── Document Persistence ──────────────────────────────────────────────────
  async addSupplierDocument(doc: Omit<SupplierDocumentProps, "id" | "createdAt" | "updatedAt">): Promise<SupplierDocumentProps> {
    const record = await (prisma as any).supplierDocument.create({
      data: {
        supplierId: doc.supplierId,
        companyId: doc.companyId,
        documentType: doc.documentType,
        title: doc.title,
        fileUrl: doc.fileUrl,
        fileKey: doc.fileKey,
        fileSize: doc.fileSize,
        mimeType: doc.mimeType,
        issueDate: doc.issueDate,
        expiryDate: doc.expiryDate,
        isVerified: doc.isVerified,
        status: doc.status,
        notes: doc.notes,
      },
    });

    return this.mapDocToDomain(record);
  }

  async updateSupplierDocument(id: string, companyId: string, doc: Partial<SupplierDocumentProps>): Promise<SupplierDocumentProps> {
    const record = await (prisma as any).supplierDocument.update({
      where: { id, companyId },
      data: {
        isVerified: doc.isVerified,
        verifiedAt: doc.verifiedAt,
        verifiedBy: doc.verifiedBy,
        status: doc.status,
        notes: doc.notes,
        expiryDate: doc.expiryDate,
        updatedAt: new Date(),
      },
    });

    return this.mapDocToDomain(record);
  }

  async deleteSupplierDocument(id: string, companyId: string): Promise<boolean> {
    await (prisma as any).supplierDocument.delete({
      where: { id, companyId },
    });
    return true;
  }

  async listSupplierDocuments(supplierId: string, companyId: string): Promise<SupplierDocumentProps[]> {
    const records = await (prisma as any).supplierDocument.findMany({
      where: { supplierId, companyId },
      orderBy: { createdAt: "desc" },
    });
    return records.map((r: any) => this.mapDocToDomain(r));
  }

  async findExpiringDocuments(companyId: string, daysThreshold: number): Promise<SupplierDocumentProps[]> {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + daysThreshold);

    const records = await (prisma as any).supplierDocument.findMany({
      where: {
        companyId,
        status: "ACTIVE",
        expiryDate: {
          lte: targetDate,
          gte: new Date(),
        },
      },
      orderBy: { expiryDate: "asc" },
    });

    return records.map((r: any) => this.mapDocToDomain(r));
  }
}
