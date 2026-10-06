/**
 * Hexagonal Inbound & Outbound Ports for Supplier Catalog Microservice
 */
import {
  SupplierDomain,
  SupplierProps,
  SupplierDocumentProps,
  SupplierCategory,
  SupplierStatus,
  DocumentType,
} from "../domain/supplier.domain";

export interface SupplierFilterCriteria {
  companyId: string;
  category?: SupplierCategory;
  status?: SupplierStatus;
  search?: string; // Query name, legalName, taxId, or contactEmail
  limit?: number;
  offset?: number;
}

// ── Outbound Port: Repository Persistence ──────────────────────────────────
export interface ISupplierRepositoryPort {
  createSupplier(supplier: SupplierProps): Promise<SupplierProps>;
  updateSupplier(id: string, companyId: string, supplier: Partial<SupplierProps>): Promise<SupplierProps>;
  findSupplierById(id: string, companyId: string): Promise<SupplierProps | null>;
  findSupplierByTaxId(taxId: string, companyId: string): Promise<SupplierProps | null>;
  listSuppliers(criteria: SupplierFilterCriteria): Promise<{ items: SupplierProps[]; total: number }>;
  deleteSupplier(id: string, companyId: string): Promise<boolean>;

  // Documents
  addSupplierDocument(doc: Omit<SupplierDocumentProps, "id" | "createdAt" | "updatedAt">): Promise<SupplierDocumentProps>;
  updateSupplierDocument(id: string, companyId: string, doc: Partial<SupplierDocumentProps>): Promise<SupplierDocumentProps>;
  deleteSupplierDocument(id: string, companyId: string): Promise<boolean>;
  listSupplierDocuments(supplierId: string, companyId: string): Promise<SupplierDocumentProps[]>;
  findExpiringDocuments(companyId: string, daysThreshold: number): Promise<SupplierDocumentProps[]>;
}

// ── Outbound Port: Event Publisher ─────────────────────────────────────────
export interface ISupplierEventPublisherPort {
  publishSupplierCreated(payload: { supplierId: string; companyId: string; name: string; taxId: string }): Promise<void>;
  publishSupplierStatusChanged(payload: { supplierId: string; companyId: string; previousStatus: string; newStatus: string; reason?: string }): Promise<void>;
  publishDocumentExpiring(payload: { supplierId: string; companyId: string; documentId: string; title: string; expiryDate: Date }): Promise<void>;
  publishSupplierComplianceAlert(payload: { supplierId: string; companyId: string; missingDocs: string[] }): Promise<void>;
}

// ── Inbound Port: Primary Use Cases Driver ──────────────────────────────────
export interface ISupplierUseCases {
  registerSupplier(params: {
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
  }): Promise<SupplierProps>;

  updateSupplierInformation(params: {
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
  }): Promise<SupplierProps>;

  changeSupplierStatus(params: {
    id: string;
    companyId: string;
    status: SupplierStatus;
    reason?: string;
  }): Promise<SupplierProps>;

  getSupplierDetails(id: string, companyId: string): Promise<{
    supplier: SupplierProps;
    compliance: { compliant: boolean; missingMandatoryDocs: string[]; expiredDocs: string[] };
  }>;

  querySuppliers(criteria: SupplierFilterCriteria): Promise<{ items: SupplierProps[]; total: number }>;

  attachCertificationDocument(params: {
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
  }): Promise<SupplierDocumentProps>;

  verifyDocument(params: {
    documentId: string;
    companyId: string;
    verifiedBy: string;
    isVerified: boolean;
    notes?: string;
  }): Promise<SupplierDocumentProps>;

  checkExpiringCertifications(companyId: string, daysThreshold?: number): Promise<SupplierDocumentProps[]>;
}
