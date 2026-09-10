/**
 * Unit Tests for DIAN Compliance Service (Hexagonal 5.0)
 * Tests CUFE SHA-384, CUNE, UBL 2.1 XML Generator, and UseCases in memory.
 */
import { describe, it, expect, vi } from "vitest";
import { DianAlgorithms } from "./core/domain/dian.domain";
import { DianComplianceUseCases } from "./core/usecases/dian.usecases";
import { IDianRepositoryPort, IDianEventPublisherPort } from "./core/ports/dian.ports";

describe("DIAN Statutory Algorithms — CUFE, CUNE & UBL 2.1", () => {
  it("generates valid 96-character SHA-384 CUFE hash", () => {
    const cufe = DianAlgorithms.generateCUFE({
      invoiceNumber: "SETP-000001",
      date: "2026-09-10",
      time: "10:00:00-05:00",
      subtotal: 1000000,
      vatAmount: 190000,
      total: 1190000,
      emitterNit: "901234567-8",
      receiverNit: "900987654-1",
      technicalKey: "fc8eac422eba16e22ffd8c6f94b3f40a6e38162c",
      environment: "2",
    });

    expect(cufe).toBeDefined();
    expect(cufe.length).toBe(96); // SHA-384 produces 96 hex characters
  });

  it("generates standard DIAN QR URL with CUFE key and params", () => {
    const qr = DianAlgorithms.generateQrUrl(
      "test_cufe_hash_string",
      "SETP-000001",
      "901234567-8",
      "900987654-1",
      1190000,
      "2026-09-10"
    );

    expect(qr).toContain("catalogo-vpfe.dian.gov.co");
    expect(qr).toContain("documentkey=test_cufe_hash_string");
    expect(qr).toContain("numfac=SETP-000001");
  });

  it("builds compliant UBL 2.1 XML structure containing UUID and Line items", () => {
    const xml = DianAlgorithms.buildUbl21Xml({
      cufe: "test_cufe_123",
      invoiceNumber: "SETP-000001",
      date: "2026-09-10",
      time: "10:00:00-05:00",
      emitterNit: "901234567-8",
      emitterName: "MI EMPRESA SAS",
      receiverNit: "900987654-1",
      receiverName: "CLIENTE SAS",
      subtotal: 1000000,
      vatAmount: 190000,
      total: 1190000,
      items: [
        { name: "Consultoría de Software", quantity: 1, unitPrice: 1000000, subtotal: 1000000 },
      ],
    });

    expect(xml).toContain('<cbc:UBLVersionID>UBL 2.1</cbc:UBLVersionID>');
    expect(xml).toContain('<cbc:UUID schemeName="CUFE-SHA384">test_cufe_123</cbc:UUID>');
    expect(xml).toContain("Consultoría de Software");
    expect(xml).toContain('<cbc:PayableAmount currencyID="COP">1190000.00</cbc:PayableAmount>');
  });
});

describe("DIAN Compliance UseCases — Hexagonal Orchestrator", () => {
  const docStore = new Map<string, any>();
  const publishedEvents: any[] = [];

  const mockRepo: IDianRepositoryPort = {
    saveDocument: async (doc) => {
      const item = { id: "doc-" + Date.now(), ...doc };
      docStore.set(item.id, item);
      return item;
    },
    findDocumentById: async (id) => docStore.get(id) || null,
    findDocumentByNumber: vi.fn(),
    listDocuments: async () => Array.from(docStore.values()),
    updateDocumentStatus: vi.fn(),
    getActiveResolution: async () => ({
      id: "res-01",
      companyId: "comp-1",
      resolutionNumber: "18760000001",
      prefix: "SETP",
      fromNumber: 1,
      toNumber: 5000,
      currentNumber: 15,
      validFrom: new Date(),
      validTo: new Date(Date.now() + 31536000000),
      technicalKey: "test-tech-key",
      isActive: true,
    }),
    listResolutions: vi.fn(),
    createResolution: vi.fn(),
    incrementResolutionNumber: async () => 16,
  };

  const mockPublisher: IDianEventPublisherPort = {
    publishDocumentApproved: async (payload) => {
      publishedEvents.push({ topic: "dian.document.approved", payload });
    },
    publishDocumentRejected: vi.fn(),
  };

  const useCases = new DianComplianceUseCases(mockRepo, mockPublisher);

  it("emits electronic invoice, calculates CUFE and publishes approved event", async () => {
    const doc = await useCases.emitElectronicInvoice({
      companyId: "comp-1",
      prefix: "SETP",
      emitterNit: "901234567-8",
      emitterName: "EMPRESA SAS",
      receiverNit: "900111222-3",
      receiverName: "CLIENTE SAS",
      subtotal: 500000,
      vatAmount: 95000,
      items: [
        { name: "Licencia Anual", quantity: 1, unitPrice: 500000, subtotal: 500000 }
      ],
    });

    expect(doc.documentNumber).toBe("SETP-000016");
    expect(doc.dianStatus).toBe("ACCEPTED");
    expect(doc.cufe?.length).toBe(96);
    expect(doc.xmlContent).toContain("UBL 2.1");

    const approvedEvent = publishedEvents.find(e => e.topic === "dian.document.approved");
    expect(approvedEvent).toBeDefined();
    expect(approvedEvent?.payload.documentNumber).toBe("SETP-000016");
  });
});
