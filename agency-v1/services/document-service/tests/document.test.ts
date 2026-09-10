import { describe, it, expect } from "vitest";
import { DocumentUseCases } from "../src/core/usecases/document.usecases";
import { DocumentDomain, isValidDocumentTransition } from "../src/core/domain/document.domain";
import { IDocumentRepositoryPort, IDocumentRendererPort, IDocumentEventPublisherPort } from "../src/core/ports/document.ports";

describe("DocumentService Hexagonal Architecture 5.0 (Inbound & Outbound Ports)", () => {
  it("valida transiciones de estado de documentos", () => {
    expect(isValidDocumentTransition("DRAFT", "SENT")).toBe(true);
    expect(isValidDocumentTransition("SENT", "SIGNED")).toBe(true);
    expect(isValidDocumentTransition("SIGNED", "SENT")).toBe(false);
  });

  it("crea y firma documento a través de casos de uso con persistencia aislada", async () => {
    const store = new Map<string, DocumentDomain>();
    const publishedEvents: any[] = [];

    const mockRepo: IDocumentRepositoryPort = {
      save: async (d) => {
        store.set(d.id, d);
        return d;
      },
      findById: async (id) => store.get(id) || null,
      findByCompany: async (compId) => Array.from(store.values()).filter((d) => d.companyId === compId),
    };

    const mockRenderer: IDocumentRendererPort = {
      renderPdf: async () => Buffer.from("PDF"),
    };

    const mockPublisher: IDocumentEventPublisherPort = {
      publishEvent: async (topic, event) => {
        publishedEvents.push({ topic, event });
      },
    };

    const useCases = new DocumentUseCases(mockRepo, mockRenderer, mockPublisher);

    // 1. Create document
    const doc = await useCases.createDocument({
      companyId: "comp-doc-1",
      title: "Contrato de Prestación de Servicios",
      type: "CONTRACT",
      clientName: "Inversiones Demo S.A.S",
      totalAmount: 12000000,
      content: "Cláusula 1: Objeto del contrato...",
    });

    expect(doc.id).toBeDefined();
    expect(doc.status).toBe("DRAFT");
    expect(doc.contentHash).toBeDefined();
    expect(publishedEvents.some((e) => e.topic === "document.created")).toBe(true);

    // 2. Sign document
    const signed = await useCases.signDocument({
      documentId: doc.id,
      signerName: "Juan Pérez",
      signerEmail: "juan@demo.com",
    });

    expect(signed.status).toBe("SIGNED");
    expect(signed.signedBy).toBe("Juan Pérez");
    expect(publishedEvents.some((e) => e.topic === "document.signed")).toBe(true);

    // 3. Query documents
    const list = await useCases.getDocuments("comp-doc-1");
    expect(list.length).toBe(1);
    expect(list[0].id).toBe(doc.id);
  });
});

