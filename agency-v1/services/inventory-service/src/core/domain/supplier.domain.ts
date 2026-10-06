/**
 * Supplier Catalog & Procurement Domain Model (Hexagonal Core)
 * Pure domain entities, business rules, and invariant validations.
 * Free of frameworks, ORMs, or infrastructure dependencies.
 */

export type SupplierCategory = 
  | "RAW_MATERIALS"
  | "SERVICES"
  | "LOGISTICS"
  | "TECHNOLOGY"
  | "GENERAL";

export type SupplierStatus = 
  | "ACTIVE" 
  | "INACTIVE" 
  | "SUSPENDED" 
  | "UNDER_REVIEW";

export type DocumentType = 
  | "RUT" 
  | "CAMARA_COMERCIO" 
  | "CERTIFICACION_BANCARIA" 
  | "ISO_9001" 
  | "SARLAFT" 
  | "ACUERDO_CONFIDENCIALIDAD" 
  | "OTRO";

export type DocumentStatus = 
  | "ACTIVE" 
  | "EXPIRED" 
  | "PENDING_REVIEW" 
  | "REJECTED";

export interface SupplierDocumentProps {
  id: string;
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
  isVerified: boolean;
  verifiedAt?: Date | null;
  verifiedBy?: string | null;
  status: DocumentStatus;
  notes?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CommercialConditions {
  paymentTermsDays: number; // e.g. 15, 30, 60, 90 days
  creditLimit: number;
  currency: string;
  discountRatePct: number;
  bankName?: string | null;
  bankAccountType?: "AHORROS" | "CORRIENTE" | string | null;
  bankAccountNumber?: string | null;
  bankAccountHolder?: string | null;
}

export interface LegalInformation {
  name: string;
  legalName?: string | null;
  taxId: string; // NIT, RFC, CIF, etc.
  taxType: string;
  country: string;
  address?: string | null;
  city?: string | null;
}

export interface ContactInformation {
  contactName?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
}

export interface SupplierProps {
  id: string;
  companyId: string;
  legal: LegalInformation;
  contact: ContactInformation;
  commercial: CommercialConditions;
  category: SupplierCategory;
  status: SupplierStatus;
  ratingScore?: number | null; // 1.0 to 5.0
  notes?: string | null;
  customFields?: Record<string, any>;
  documents?: SupplierDocumentProps[];
  createdAt: Date;
  updatedAt: Date;
}

export class SupplierDomain {
  private props: SupplierProps;

  constructor(props: SupplierProps) {
    this.validate(props);
    this.props = { ...props };
  }

  public static create(dto: {
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
  }): SupplierDomain {
    const now = new Date();
    return new SupplierDomain({
      id: crypto.randomUUID(),
      companyId: dto.companyId,
      legal: {
        name: dto.name.trim(),
        legalName: dto.legalName?.trim() || null,
        taxId: dto.taxId.trim().toUpperCase(),
        taxType: dto.taxType || "NIT",
        country: dto.country || "Colombia",
        address: dto.address?.trim() || null,
        city: dto.city?.trim() || null,
      },
      contact: {
        contactName: dto.contactName?.trim() || null,
        contactEmail: dto.contactEmail?.trim().toLowerCase() || null,
        contactPhone: dto.contactPhone?.trim() || null,
      },
      commercial: {
        paymentTermsDays: dto.paymentTermsDays !== undefined ? dto.paymentTermsDays : 30,
        creditLimit: dto.creditLimit !== undefined ? Math.max(0, dto.creditLimit) : 0,
        currency: dto.currency || "COP",
        discountRatePct: dto.discountRatePct !== undefined ? Math.max(0, Math.min(100, dto.discountRatePct)) : 0,
        bankName: dto.bankName?.trim() || null,
        bankAccountType: dto.bankAccountType || null,
        bankAccountNumber: dto.bankAccountNumber?.trim() || null,
        bankAccountHolder: dto.bankAccountHolder?.trim() || null,
      },
      category: dto.category || "GENERAL",
      status: "ACTIVE",
      ratingScore: 5.0,
      notes: dto.notes?.trim() || null,
      customFields: dto.customFields || {},
      documents: [],
      createdAt: now,
      updatedAt: now,
    });
  }

  private validate(props: SupplierProps): void {
    if (!props.companyId) {
      throw new Error("El identificador único de inquilino (companyId) es obligatorio.");
    }
    if (!props.legal.name || props.legal.name.trim().length < 2) {
      throw new Error("El nombre comercial del proveedor debe contener al menos 2 caracteres.");
    }
    if (!props.legal.taxId || props.legal.taxId.trim().length < 3) {
      throw new Error("El número de identificación fiscal (NIT/Tax ID) es obligatorio.");
    }
    if (props.commercial.paymentTermsDays < 0) {
      throw new Error("El plazo de pago comercial no puede ser negativo.");
    }
    if (props.commercial.discountRatePct < 0 || props.commercial.discountRatePct > 100) {
      throw new Error("El porcentaje de descuento comercial debe situarse entre 0% y 100%.");
    }
    if (props.contact.contactEmail && !this.isValidEmail(props.contact.contactEmail)) {
      throw new Error("El formato del correo de contacto es inválido.");
    }
  }

  private isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  // Domain state modifiers
  public updateLegal(legal: Partial<LegalInformation>): void {
    this.props.legal = { ...this.props.legal, ...legal };
    this.props.updatedAt = new Date();
  }

  public updateContact(contact: Partial<ContactInformation>): void {
    if (contact.contactEmail && !this.isValidEmail(contact.contactEmail)) {
      throw new Error("El formato del correo de contacto es inválido.");
    }
    this.props.contact = { ...this.props.contact, ...contact };
    this.props.updatedAt = new Date();
  }

  public updateCommercial(commercial: Partial<CommercialConditions>): void {
    if (commercial.paymentTermsDays !== undefined && commercial.paymentTermsDays < 0) {
      throw new Error("El plazo de pago no puede ser negativo.");
    }
    if (commercial.discountRatePct !== undefined && (commercial.discountRatePct < 0 || commercial.discountRatePct > 100)) {
      throw new Error("El porcentaje de descuento debe estar entre 0% y 100%.");
    }
    this.props.commercial = { ...this.props.commercial, ...commercial };
    this.props.updatedAt = new Date();
  }

  public setStatus(status: SupplierStatus, reason?: string): void {
    this.props.status = status;
    if (reason) {
      this.props.notes = `${this.props.notes ? this.props.notes + "\n" : ""}[${new Date().toISOString()}] Cambio de estado a ${status}: ${reason}`;
    }
    this.props.updatedAt = new Date();
  }

  public updateRating(rating: number): void {
    if (rating < 1.0 || rating > 5.0) {
      throw new Error("La calificación de proveedor debe estar entre 1.0 y 5.0 estrellas.");
    }
    this.props.ratingScore = rating;
    this.props.updatedAt = new Date();
  }

  public isCertificationCompliant(): { compliant: boolean; missingMandatoryDocs: string[]; expiredDocs: string[] } {
    const mandatory: DocumentType[] = ["RUT", "CAMARA_COMERCIO", "CERTIFICACION_BANCARIA"];
    const docs = this.props.documents || [];
    const now = new Date();

    const missingMandatoryDocs: string[] = [];
    const expiredDocs: string[] = [];

    for (const req of mandatory) {
      const found = docs.find(d => d.documentType === req && d.status === "ACTIVE");
      if (!found) {
        missingMandatoryDocs.push(req);
      }
    }

    for (const doc of docs) {
      if (doc.expiryDate && new Date(doc.expiryDate) < now) {
        expiredDocs.push(`${doc.documentType} (${doc.title})`);
      }
    }

    return {
      compliant: missingMandatoryDocs.length === 0 && expiredDocs.length === 0,
      missingMandatoryDocs,
      expiredDocs,
    };
  }

  public attachDocument(doc: SupplierDocumentProps): void {
    if (!this.props.documents) {
      this.props.documents = [];
    }
    this.props.documents.push(doc);
    this.props.updatedAt = new Date();
  }

  public getProps(): SupplierProps {
    return this.props;
  }

  public toJSON(): SupplierProps {
    return JSON.parse(JSON.stringify(this.props));
  }
}
