/**
 * Ports for DIAN Compliance Service (Hexagonal 5.0)
 */
import { DianDocumentProps, DianResolutionProps } from "../domain/dian.domain";

export interface IDianRepositoryPort {
  saveDocument(doc: Omit<DianDocumentProps, "id">): Promise<DianDocumentProps>;
  findDocumentById(id: string): Promise<DianDocumentProps | null>;
  findDocumentByNumber(companyId: string, docNumber: string): Promise<DianDocumentProps | null>;
  listDocuments(companyId: string, status?: string): Promise<DianDocumentProps[]>;
  updateDocumentStatus(id: string, status: string, dianResponse?: any): Promise<DianDocumentProps>;

  // Resolutions
  getActiveResolution(companyId: string, prefix: string): Promise<DianResolutionProps | null>;
  listResolutions(companyId: string): Promise<DianResolutionProps[]>;
  createResolution(res: Omit<DianResolutionProps, "id">): Promise<DianResolutionProps>;
  incrementResolutionNumber(id: string): Promise<number>;
}

export interface IDianEventPublisherPort {
  publishDocumentApproved(payload: { documentId: string; companyId: string; cufe: string; documentNumber: string }): Promise<void>;
  publishDocumentRejected(payload: { documentId: string; companyId: string; errors: any }): Promise<void>;
}

export interface IDianComplianceUseCases {
  emitElectronicInvoice(params: {
    companyId: string;
    prefix: string;
    emitterNit: string;
    emitterName: string;
    receiverNit: string;
    receiverName: string;
    subtotal: number;
    vatAmount: number;
    items: Array<{ name: string; quantity: number; unitPrice: number; subtotal: number }>;
  }): Promise<DianDocumentProps>;

  emitPosEquivalent(params: {
    companyId: string;
    cierreZId?: string;
    totalAmount: number;
    taxAmount: number;
    cashierName: string;
  }): Promise<DianDocumentProps>;
}
