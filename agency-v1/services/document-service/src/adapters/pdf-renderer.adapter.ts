/**
 * Document Service — PDF Renderer Adapter
 * ─────────────────────────────────────────────────────────────────────────────
 */
import { IDocumentRendererPort } from "../core/ports/document.ports";

export class PdfRendererAdapter implements IDocumentRendererPort {
  public async renderPdf(htmlOrMarkdown: string): Promise<Buffer> {
    return Buffer.from("%PDF-1.4 Mocked PDF content");
  }
}
