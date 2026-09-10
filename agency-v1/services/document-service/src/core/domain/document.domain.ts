/**
 * Document Service — Pure Domain Entities & Digital Integrity
 * ─────────────────────────────────────────────────────────────────────────────
 * Zero external framework dependencies.
 */
import { createHash } from "crypto";

export type DocumentType = "PROPOSAL" | "CONTRACT" | "QUOTE" | "NDA";
export type DocumentStatus = "DRAFT" | "SENT" | "SIGNED" | "REJECTED";

export function computeDocumentHash(content: string, title: string, companyId: string): string {
  return createHash("sha256").update(`${companyId}:${title}:${content}`, "utf8").digest("hex");
}

export function isValidDocumentTransition(current: DocumentStatus, next: DocumentStatus): boolean {
  const map: Record<DocumentStatus, DocumentStatus[]> = {
    DRAFT: ["SENT", "REJECTED"],
    SENT: ["SIGNED", "REJECTED"],
    SIGNED: [], // Terminal
    REJECTED: ["DRAFT"],
  };
  return (map[current] || []).includes(next);
}

export class DocumentDomain {
  constructor(
    public readonly id: string,
    public readonly companyId: string,
    public readonly title: string,
    public readonly type: DocumentType = "PROPOSAL",
    public readonly status: DocumentStatus = "DRAFT",
    public readonly clientName?: string,
    public readonly totalAmount: number = 0,
    public readonly content: string = "",
    public readonly contentHash: string = "",
    public readonly signedBy?: string,
    public readonly signedAt?: Date,
    public readonly createdAt: Date = new Date()
  ) {}

  public static create(dto: {
    id?: string;
    companyId: string;
    title: string;
    type?: DocumentType;
    clientName?: string;
    totalAmount?: number;
    content?: string;
  }): DocumentDomain {
    const content = dto.content || "";
    const hash = computeDocumentHash(content, dto.title, dto.companyId);

    return new DocumentDomain(
      dto.id || "doc_" + Math.random().toString(36).substring(2, 9),
      dto.companyId,
      dto.title,
      dto.type || "PROPOSAL",
      "DRAFT",
      dto.clientName,
      dto.totalAmount || 0,
      content,
      hash,
      undefined,
      undefined,
      new Date()
    );
  }

  public sign(signerName: string): DocumentDomain {
    if (!isValidDocumentTransition(this.status, "SIGNED") && this.status !== "DRAFT") {
      throw new Error(`No se puede firmar un documento en estado ${this.status}`);
    }

    return new DocumentDomain(
      this.id,
      this.companyId,
      this.title,
      this.type,
      "SIGNED",
      this.clientName,
      this.totalAmount,
      this.content,
      this.contentHash,
      signerName,
      new Date(),
      this.createdAt
    );
  }
}
