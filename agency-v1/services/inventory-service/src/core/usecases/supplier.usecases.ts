/**
 * Supplier Use Cases Implementation (Hexagonal Core Application Layer)
 * Implements business orchestration, cross-cutting invariants, and event emission.
 */
import {
  SupplierDomain,
  SupplierProps,
  SupplierDocumentProps,
  SupplierCategory,
  SupplierStatus,
  DocumentType,
} from "../domain/supplier.domain";
import {
  ISupplierUseCases,
  ISupplierRepositoryPort,
  ISupplierEventPublisherPort,
  SupplierFilterCriteria,
} from "../ports/supplier.ports";

export class SupplierUseCases implements ISupplierUseCases {
  constructor(
    private readonly repository: ISupplierRepositoryPort,
    private readonly eventPublisher: ISupplierEventPublisherPort
  ) {}

  public async registerSupplier(params: {
    companyId: string;
    name: string;
    legalName?: string | null;
    taxId: string;
    taxType?: string;
    category?: SupplierCategory;
    contactName?: string | null;
    contactEmail?: string | null;
    contactPhone?: string | null;
    address?: string | null;
    city?: string | null;
    country?: string;
    paymentTermsDays?: number;
    creditLimit?: number;
    currency?: string;
    bankName?: string | null;
    bankAccountType?: string | null;
    bankAccountNumber?: string | null;
    bankAccountHolder?: string | null;
    discountRatePct?: number;
    notes?: string | null;
    customFields?: Record<string, any>;
  }): Promise<SupplierProps> {
    // 1. Check uniqueness of taxId within the tenant (Multi-tenant invariant)
    const existing = await this.repository.findSupplierByTaxId(params.taxId.trim().toUpperCase(), params.companyId);
    if (existing) {
      throw new Error(`Ya existe un proveedor registrado con el NIT/Identificación fiscal ${params.taxId} en esta empresa.`);
    }

    // 2. Instantiate and validate domain model
    const domainSupplier = SupplierDomain.create(params);
    const supplierProps = domainSupplier.toJSON();

    // 3. Persist via repository port
    const created = await this.repository.createSupplier(supplierProps);

    // 4. Publish event asynchronously
    this.eventPublisher.publishSupplierCreated({
      supplierId: created.id,
      companyId: created.companyId,
      name: created.legal.name,
      taxId: created.legal.taxId,
    }).catch(err => console.warn("[SupplierUseCases] Event publish warning:", err.message));

    return created;
  }

  public async updateSupplierInformation(params: {
    id: string;
    companyId: string;
    legal?: Partial<{
      name: string;
      legalName: string | null;
      taxId: string;
      taxType: string;
      country: string;
      address: string | null;
      city: string | null;
    }>;
    contact?: Partial<{
      contactName: string | null;
      contactEmail: string | null;
      contactPhone: string | null;
    }>;
    commercial?: Partial<{
      paymentTermsDays: number;
      creditLimit: number;
      currency: string;
      discountRatePct: number;
      bankName: string | null;
      bankAccountType: string | null;
      bankAccountNumber: string | null;
      bankAccountHolder: string | null;
    }>;
    category?: SupplierCategory;
    notes?: string | null;
  }): Promise<SupplierProps> {
    const existing = await this.repository.findSupplierById(params.id, params.companyId);
    if (!existing) {
      throw new Error(`Proveedor no encontrado (ID: ${params.id}).`);
    }

    // If taxId is changing, ensure new taxId is not used by another supplier
    if (params.legal?.taxId && params.legal.taxId.trim().toUpperCase() !== existing.legal.taxId) {
      const duplicate = await this.repository.findSupplierByTaxId(params.legal.taxId.trim().toUpperCase(), params.companyId);
      if (duplicate && duplicate.id !== params.id) {
        throw new Error(`El NIT/Identificación fiscal ${params.legal.taxId} ya está en uso por otro proveedor.`);
      }
    }

    const domain = new SupplierDomain(existing);
    if (params.legal) domain.updateLegal(params.legal);
    if (params.contact) domain.updateContact(params.contact);
    if (params.commercial) domain.updateCommercial(params.commercial);
    if (params.category) domain.toJSON().category = params.category;
    if (params.notes !== undefined) domain.toJSON().notes = params.notes;

    const updatedProps = domain.toJSON();
    return this.repository.updateSupplier(params.id, params.companyId, updatedProps);
  }

  public async changeSupplierStatus(params: {
    id: string;
    companyId: string;
    status: SupplierStatus;
    reason?: string;
  }): Promise<SupplierProps> {
    const existing = await this.repository.findSupplierById(params.id, params.companyId);
    if (!existing) {
      throw new Error(`Proveedor no encontrado (ID: ${params.id}).`);
    }

    const previousStatus = existing.status;
    const domain = new SupplierDomain(existing);
    domain.setStatus(params.status, params.reason);

    const updated = await this.repository.updateSupplier(params.id, params.companyId, domain.toJSON());

    this.eventPublisher.publishSupplierStatusChanged({
      supplierId: updated.id,
      companyId: updated.companyId,
      previousStatus,
      newStatus: updated.status,
      reason: params.reason,
    }).catch(err => console.warn("[SupplierUseCases] Event publish warning:", err.message));

    return updated;
  }

  public async getSupplierDetails(id: string, companyId: string): Promise<{
    supplier: SupplierProps;
    compliance: { compliant: boolean; missingMandatoryDocs: string[]; expiredDocs: string[] };
  }> {
    const supplier = await this.repository.findSupplierById(id, companyId);
    if (!supplier) {
      throw new Error(`Proveedor no encontrado.`);
    }

    // Fetch documents
    const documents = await this.repository.listSupplierDocuments(id, companyId);
    supplier.documents = documents;

    const domain = new SupplierDomain(supplier);
    const compliance = domain.isCertificationCompliant();

    return {
      supplier,
      compliance,
    };
  }

  public async querySuppliers(criteria: SupplierFilterCriteria): Promise<{ items: SupplierProps[]; total: number }> {
    return this.repository.listSuppliers(criteria);
  }

  public async attachCertificationDocument(params: {
    supplierId: string;
    companyId: string;
    documentType: DocumentType;
    title: string;
    fileUrl: string;
    fileKey?: string | null;
    fileSize?: number | null;
    mimeType?: string | null;
    issueDate?: Date | null;
    expiryDate?: Date | null;
    notes?: string | null;
  }): Promise<SupplierDocumentProps> {
    const supplier = await this.repository.findSupplierById(params.supplierId, params.companyId);
    if (!supplier) {
      throw new Error(`Proveedor no encontrado (ID: ${params.supplierId}).`);
    }

    const doc = await this.repository.addSupplierDocument({
      supplierId: params.supplierId,
      companyId: params.companyId,
      documentType: params.documentType,
      title: params.title.trim(),
      fileUrl: params.fileUrl.trim(),
      fileKey: params.fileKey || null,
      fileSize: params.fileSize || null,
      mimeType: params.mimeType || null,
      issueDate: params.issueDate || null,
      expiryDate: params.expiryDate || null,
      isVerified: false,
      status: "ACTIVE",
      notes: params.notes || null,
    });

    return doc;
  }

  public async verifyDocument(params: {
    documentId: string;
    companyId: string;
    verifiedBy: string;
    isVerified: boolean;
    notes?: string;
  }): Promise<SupplierDocumentProps> {
    const updated = await this.repository.updateSupplierDocument(params.documentId, params.companyId, {
      isVerified: params.isVerified,
      verifiedAt: new Date(),
      verifiedBy: params.verifiedBy,
      status: params.isVerified ? "ACTIVE" : "REJECTED",
      notes: params.notes,
    });

    return updated;
  }

  public async checkExpiringCertifications(companyId: string, daysThreshold: number = 30): Promise<SupplierDocumentProps[]> {
    const expiring = await this.repository.findExpiringDocuments(companyId, daysThreshold);

    for (const doc of expiring) {
      if (doc.expiryDate) {
        this.eventPublisher.publishDocumentExpiring({
          supplierId: doc.supplierId,
          companyId: doc.companyId,
          documentId: doc.id,
          title: doc.title,
          expiryDate: doc.expiryDate,
        }).catch(() => {});
      }
    }

    return expiring;
  }
}
