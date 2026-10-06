/**
 * Unit Tests for Supplier Catalog Domain & Hexagonal Engine
 * Runs completely in memory with zero database dependencies.
 */
import { describe, it, expect, vi } from "vitest";
import { SupplierDomain } from "./core/domain/supplier.domain";
import { SupplierUseCases } from "./core/usecases/supplier.usecases";
import { ISupplierRepositoryPort, ISupplierEventPublisherPort } from "./core/ports/supplier.ports";

describe("Supplier Domain Model & Invariant Rules", () => {
  it("creates a valid supplier domain entity with default values", () => {
    const supplier = SupplierDomain.create({
      companyId: "tenant-100",
      name: "Distribuidora Andina SAS",
      taxId: "900.123.456-7",
      category: "RAW_MATERIALS",
      contactEmail: "contacto@andina.com",
      paymentTermsDays: 45,
      creditLimit: 50000000,
    });

    const json = supplier.toJSON();
    expect(json.companyId).toBe("tenant-100");
    expect(json.legal.name).toBe("Distribuidora Andina SAS");
    expect(json.legal.taxId).toBe("900.123.456-7");
    expect(json.commercial.paymentTermsDays).toBe(45);
    expect(json.commercial.creditLimit).toBe(50000000);
    expect(json.status).toBe("ACTIVE");
    expect(json.ratingScore).toBe(5.0);
  });

  it("throws error when companyId is missing", () => {
    expect(() => {
      SupplierDomain.create({
        companyId: "",
        name: "Proveedor X",
        taxId: "12345678",
      });
    }).toThrow("El identificador único de inquilino (companyId) es obligatorio");
  });

  it("throws error when taxId is empty or too short", () => {
    expect(() => {
      SupplierDomain.create({
        companyId: "tenant-1",
        name: "Proveedor X",
        taxId: "12",
      });
    }).toThrow("El número de identificación fiscal (NIT/Tax ID) es obligatorio");
  });

  it("throws error when email format is invalid", () => {
    expect(() => {
      SupplierDomain.create({
        companyId: "tenant-1",
        name: "Proveedor X",
        taxId: "900111222",
        contactEmail: "correo-invalido",
      });
    }).toThrow("El formato del correo de contacto es inválido");
  });

  it("verifies compliance: detects missing mandatory documents", () => {
    const supplier = SupplierDomain.create({
      companyId: "tenant-1",
      name: "Insumos del Valle",
      taxId: "800999888",
    });

    const compliance = supplier.isCertificationCompliant();
    expect(compliance.compliant).toBe(false);
    expect(compliance.missingMandatoryDocs).toContain("RUT");
    expect(compliance.missingMandatoryDocs).toContain("CAMARA_COMERCIO");
    expect(compliance.missingMandatoryDocs).toContain("CERTIFICACION_BANCARIA");
  });

  it("verifies compliance: passes when all active mandatory documents are attached", () => {
    const supplier = SupplierDomain.create({
      companyId: "tenant-1",
      name: "Insumos del Valle",
      taxId: "800999888",
    });

    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 1);

    supplier.attachDocument({
      id: "d-1",
      supplierId: supplier.getProps().id,
      companyId: "tenant-1",
      documentType: "RUT",
      title: "RUT Actualizado 2026",
      fileUrl: "https://storage.agency.com/rut.pdf",
      isVerified: true,
      status: "ACTIVE",
      expiryDate: futureDate,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    supplier.attachDocument({
      id: "d-2",
      supplierId: supplier.getProps().id,
      companyId: "tenant-1",
      documentType: "CAMARA_COMERCIO",
      title: "Cámara de Comercio Vigente",
      fileUrl: "https://storage.agency.com/cc.pdf",
      isVerified: true,
      status: "ACTIVE",
      expiryDate: futureDate,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    supplier.attachDocument({
      id: "d-3",
      supplierId: supplier.getProps().id,
      companyId: "tenant-1",
      documentType: "CERTIFICACION_BANCARIA",
      title: "Certificado Bancario Bancolombia",
      fileUrl: "https://storage.agency.com/cert.pdf",
      isVerified: true,
      status: "ACTIVE",
      expiryDate: futureDate,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const compliance = supplier.isCertificationCompliant();
    expect(compliance.compliant).toBe(true);
    expect(compliance.missingMandatoryDocs.length).toBe(0);
    expect(compliance.expiredDocs.length).toBe(0);
  });
});

describe("Supplier Use Cases — Hexagonal Execution Layer", () => {
  const mockDbStore = new Map<string, any>();
  const mockDocsStore = new Map<string, any>();
  const publishedEvents: any[] = [];

  const mockRepo: ISupplierRepositoryPort = {
    createSupplier: async (data) => {
      mockDbStore.set(data.id, data);
      return data;
    },
    updateSupplier: async (id, companyId, partial) => {
      const existing = mockDbStore.get(id);
      const merged = { ...existing, ...partial };
      mockDbStore.set(id, merged);
      return merged;
    },
    findSupplierById: async (id, companyId) => {
      return mockDbStore.get(id) || null;
    },
    findSupplierByTaxId: async (taxId, companyId) => {
      for (const val of mockDbStore.values()) {
        if (val.companyId === companyId && val.legal.taxId === taxId) {
          return val;
        }
      }
      return null;
    },
    listSuppliers: async (criteria) => {
      const all = Array.from(mockDbStore.values()).filter(v => v.companyId === criteria.companyId);
      return { items: all, total: all.length };
    },
    deleteSupplier: async (id, companyId) => {
      mockDbStore.delete(id);
      return true;
    },
    addSupplierDocument: async (doc) => {
      const docWithId = { ...doc, id: "doc-" + Math.random(), createdAt: new Date(), updatedAt: new Date() };
      mockDocsStore.set(docWithId.id, docWithId);
      return docWithId;
    },
    updateSupplierDocument: async (id, companyId, partial) => {
      const existing = mockDocsStore.get(id);
      const updated = { ...existing, ...partial };
      mockDocsStore.set(id, updated);
      return updated;
    },
    deleteSupplierDocument: async (id, companyId) => {
      mockDocsStore.delete(id);
      return true;
    },
    listSupplierDocuments: async (supplierId, companyId) => {
      return Array.from(mockDocsStore.values()).filter(d => d.supplierId === supplierId && d.companyId === companyId);
    },
    findExpiringDocuments: async (companyId, days) => {
      return [];
    },
  };

  const mockEventPublisher: ISupplierEventPublisherPort = {
    publishSupplierCreated: async (payload) => {
      publishedEvents.push({ type: "created", payload });
    },
    publishSupplierStatusChanged: async (payload) => {
      publishedEvents.push({ type: "status_changed", payload });
    },
    publishDocumentExpiring: async (payload) => {
      publishedEvents.push({ type: "doc_expiring", payload });
    },
    publishSupplierComplianceAlert: async (payload) => {
      publishedEvents.push({ type: "compliance_alert", payload });
    },
  };

  const useCases = new SupplierUseCases(mockRepo, mockEventPublisher);

  it("registers a supplier and prevents duplicate tax ID within the tenant", async () => {
    const created = await useCases.registerSupplier({
      companyId: "tenant-99",
      name: "Agro Suministros Boyacá",
      taxId: "900555444-1",
      contactEmail: "ventas@agroboyaca.com",
      paymentTermsDays: 30,
    });

    expect(created.id).toBeDefined();
    expect(created.legal.name).toBe("Agro Suministros Boyacá");

    // Attempt duplicate registration
    await expect(useCases.registerSupplier({
      companyId: "tenant-99",
      name: "Agro Suministros Copia",
      taxId: "900555444-1",
    })).rejects.toThrow("Ya existe un proveedor registrado con el NIT");
  });

  it("updates commercial conditions and state transitions", async () => {
    const registered = await useCases.registerSupplier({
      companyId: "tenant-99",
      name: "Textiles de Colombia",
      taxId: "800333222-5",
    });

    const updated = await useCases.updateSupplierInformation({
      id: registered.id,
      companyId: "tenant-99",
      commercial: {
        paymentTermsDays: 60,
        creditLimit: 15000000,
        currency: "COP",
        discountRatePct: 5,
        bankName: "Davivienda",
        bankAccountType: "CORRIENTE",
        bankAccountNumber: "0019283746",
        bankAccountHolder: "Textiles de Colombia SAS",
      },
    });

    expect(updated.commercial.paymentTermsDays).toBe(60);
    expect(updated.commercial.creditLimit).toBe(15000000);
    expect(updated.commercial.bankName).toBe("Davivienda");

    const suspended = await useCases.changeSupplierStatus({
      id: registered.id,
      companyId: "tenant-99",
      status: "SUSPENDED",
      reason: "Incumplimiento de entregas",
    });

    expect(suspended.status).toBe("SUSPENDED");
  });
});
