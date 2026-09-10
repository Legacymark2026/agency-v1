/**
 * Document Service — Pure Hexagonal Use Cases Orchestration
 * ─────────────────────────────────────────────────────────────────────────────
 */
import {
  IDocumentUseCases,
  IDocumentRepositoryPort,
  IDocumentRendererPort,
  IDocumentEventPublisherPort,
  CreateDocumentDTO,
  SignDocumentDTO,
} from "../ports/document.ports";
import { DocumentDomain } from "../domain/document.domain";

export class DocumentUseCases implements IDocumentUseCases {
  constructor(
    private readonly repoPort: IDocumentRepositoryPort,
    private readonly rendererPort: IDocumentRendererPort,
    private readonly eventPublisher: IDocumentEventPublisherPort
  ) {}

  public async createDocument(dto: CreateDocumentDTO): Promise<DocumentDomain> {
    const doc = DocumentDomain.create(dto);
    const saved = await this.repoPort.save(doc);

    await this.eventPublisher.publishEvent("document.created", {
      documentId: saved.id,
      companyId: saved.companyId,
      title: saved.title,
      hash: saved.contentHash,
    });

    return saved;
  }

  public async signDocument(dto: SignDocumentDTO): Promise<DocumentDomain> {
    const doc = await this.repoPort.findById(dto.documentId);
    if (!doc) throw new Error(`Documento ${dto.documentId} no encontrado`);

    const signed = doc.sign(dto.signerName);
    const updated = await this.repoPort.save(signed);

    await this.eventPublisher.publishEvent("document.signed", {
      documentId: updated.id,
      companyId: updated.companyId,
      signerName: dto.signerName,
      signedAt: updated.signedAt,
    });

    return updated;
  }

  public async getDocuments(companyId: string): Promise<DocumentDomain[]> {
    return this.repoPort.findByCompany(companyId);
  }
}
