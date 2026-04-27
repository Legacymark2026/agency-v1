/**
 * tests/unit/tenant-prisma.test.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Tests unitarios para el cliente Prisma multi-tenant (lib/tenant-prisma.ts)
 * Mejora 6.4
 */

import { describe, it, expect, vi } from "vitest";

// Mock del cliente Prisma base
const mockQuery = vi.fn(async (args: any) => args);
const mockPrisma = {
  $extends: vi.fn((extensions: any) => {
    // Simular la extensión ejecutando el query interceptor
    const handler = extensions.query.$allModels.$allOperations;
    return {
      _handler: handler,
      _query: mockQuery,
    };
  }),
};

vi.mock("@/lib/prisma", () => ({
  prisma: mockPrisma,
}));

const { getTenantPrisma } = await import("@/lib/tenant-prisma");

describe("getTenantPrisma", () => {
  it("debe lanzar error si companyId está vacío", () => {
    expect(() => getTenantPrisma("")).toThrow(
      "[Tenant Prisma] ERROR FATAL: No companyId provided"
    );
  });

  it("debe crear un cliente extendido con companyId válido", () => {
    const db = getTenantPrisma("company-123");
    expect(db).toBeDefined();
    expect(mockPrisma.$extends).toHaveBeenCalledOnce();
  });

  it("debe llamar $extends con la configuración correcta", () => {
    getTenantPrisma("tenant-abc");
    const extendConfig = mockPrisma.$extends.mock.calls[0][0];
    expect(extendConfig).toHaveProperty("query");
    expect(extendConfig.query).toHaveProperty("$allModels");
    expect(extendConfig.query.$allModels).toHaveProperty("$allOperations");
  });
});

describe("getTenantPrisma — interceptor de queries", () => {
  const companyId = "test-company";

  async function simulateOperation(
    model: string,
    operation: string,
    args: any
  ) {
    const db = getTenantPrisma(companyId);
    const handler = (mockPrisma.$extends.mock.calls.at(-1)![0] as any)
      .query.$allModels.$allOperations;
    
    return handler({
      model,
      operation,
      args: { ...args },
      query: async (a: any) => a, // query identity — devuelve args modificados
    });
  }

  it("debe inyectar companyId en findMany de modelos tenant", async () => {
    const result = await simulateOperation("Lead", "findMany", { where: {} });
    expect(result.where).toHaveProperty("companyId", companyId);
  });

  it("debe inyectar companyId en findFirst de modelos tenant", async () => {
    const result = await simulateOperation("Deal", "findFirst", { where: { stage: "NEW" } });
    expect(result.where).toHaveProperty("companyId", companyId);
    expect(result.where).toHaveProperty("stage", "NEW"); // Mantener filtros originales
  });

  it("debe inyectar companyId en updateMany de modelos tenant", async () => {
    const result = await simulateOperation("Lead", "updateMany", {
      where: { id: { in: ["id-1", "id-2"] } },
      data: { status: "CONTACTED" },
    });
    expect(result.where).toHaveProperty("companyId", companyId);
  });

  it("debe inyectar companyId en create de modelos tenant", async () => {
    const result = await simulateOperation("Campaign", "create", {
      data: { name: "Test Campaign", platform: "META" },
    });
    expect(result.data).toHaveProperty("companyId", companyId);
  });

  it("NO debe inyectar companyId en modelos que no son tenant (ej: User)", async () => {
    const result = await simulateOperation("User", "findMany", { where: {} });
    // Para User, el query pasa sin modificaciones
    expect(result.where).not.toHaveProperty("companyId");
  });
});
