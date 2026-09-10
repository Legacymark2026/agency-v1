/**
 * Document Service — Hexagonal Ports (Inbound & Outbound Interfaces)
 * ─────────────────────────────────────────────────────────────────────────────
 */
import { DocumentDomain, DocumentType } from "../domain/document.domain";

export interface CreateDocumentDTO {
  companyId: string;
  title: string;
  type?: DocumentType;
  clientName?: string;
  totalAmount?: number;
  content?: string;
}

export interface SignDocumentDTO {
  documentId: string;
  signerName: string;
  signerEmail?: string;
}

// Inbound Port: Primary Use Cases
export interface IDocumentUseCases {
  createDocument(dto: CreateDocumentDTO): Promise<DocumentDomain>;
  signDocument(dto: SignDocumentDTO): Promise<DocumentDomain>;
  getDocuments(companyId: string): Promise<DocumentDomain[]>;
}

// Outbound Port: Persistence
export interface IDocumentRepositoryPort {
  save(doc: DocumentDomain): Promise<DocumentDomain>;
  findById(id: string): Promise<DocumentDomain | null>;
  findByCompany(companyId: string): Promise<DocumentDomain[]>;
}

// Outbound Port: PDF Rendering
export interface IDocumentRendererPort {
  renderPdf(htmlOrMarkdown: string): Promise<Buffer>;
}

// Outbound Port: Event Publisher
export interface IDocumentEventPublisherPort {
  publishEvent(topic: string, event: Record<string, any>): Promise<void>;
}
