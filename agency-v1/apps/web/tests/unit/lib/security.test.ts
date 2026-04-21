/**
 * tests/unit/lib/security.test.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Tests unitarios para las funciones de autorización RBAC.
 *
 * Cubre los escenarios más críticos:
 * - hasAnyPermission / hasAllPermissions con batched queries
 * - Comportamiento con arrays vacíos
 * - Manejo de errores de DB (fail safe)
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock del cliente Prisma
vi.mock("@/lib/prisma", () => ({
  prisma: {
    companyUser: {
      findFirst: vi.fn(),
    },
  },
}));

// Mock de auth
vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));

import { hasAnyPermission, hasAllPermissions } from "@/lib/security";
import { prisma } from "@/lib/prisma";

const USER_ID = "user-123";
const COMPANY_ID = "company-456";

describe("hasAnyPermission", () => {
  beforeEach(() => vi.clearAllMocks());

  it("retorna false si el array de permisos está vacío", async () => {
    const result = await hasAnyPermission(USER_ID, COMPANY_ID, []);
    expect(result).toBe(false);
    expect(prisma.companyUser.findFirst).not.toHaveBeenCalled();
  });

  it("retorna true si el usuario tiene al menos uno de los permisos", async () => {
    vi.mocked(prisma.companyUser.findFirst).mockResolvedValueOnce({
      role: {
        permissions: [
          { permission: { name: "crm.deals.view" } },
        ],
      },
    } as any);

    const result = await hasAnyPermission(USER_ID, COMPANY_ID, [
      "crm.deals.view",
      "crm.deals.edit",
    ]);
    expect(result).toBe(true);
    // Verifica que solo se hace UNA query (no N+1)
    expect(prisma.companyUser.findFirst).toHaveBeenCalledTimes(1);
  });

  it("retorna false si el usuario no tiene ninguno de los permisos", async () => {
    vi.mocked(prisma.companyUser.findFirst).mockResolvedValueOnce({
      role: { permissions: [] },
    } as any);

    const result = await hasAnyPermission(USER_ID, COMPANY_ID, [
      "admin.super",
      "billing.manage",
    ]);
    expect(result).toBe(false);
  });

  it("retorna false (fail safe) si la BD lanza un error", async () => {
    vi.mocked(prisma.companyUser.findFirst).mockRejectedValueOnce(
      new Error("DB connection lost")
    );

    const result = await hasAnyPermission(USER_ID, COMPANY_ID, ["crm.deals.view"]);
    expect(result).toBe(false); // Fail safe — no exponer error al cliente
  });
});

describe("hasAllPermissions", () => {
  beforeEach(() => vi.clearAllMocks());

  it("retorna true si el array de permisos está vacío", async () => {
    const result = await hasAllPermissions(USER_ID, COMPANY_ID, []);
    expect(result).toBe(true);
    expect(prisma.companyUser.findFirst).not.toHaveBeenCalled();
  });

  it("retorna true si el usuario tiene TODOS los permisos solicitados", async () => {
    vi.mocked(prisma.companyUser.findFirst).mockResolvedValueOnce({
      role: {
        permissions: [
          { permission: { name: "crm.deals.view" } },
          { permission: { name: "crm.deals.edit" } },
        ],
      },
    } as any);

    const result = await hasAllPermissions(USER_ID, COMPANY_ID, [
      "crm.deals.view",
      "crm.deals.edit",
    ]);
    expect(result).toBe(true);
    expect(prisma.companyUser.findFirst).toHaveBeenCalledTimes(1);
  });

  it("retorna false si al usuario le falta algún permiso", async () => {
    vi.mocked(prisma.companyUser.findFirst).mockResolvedValueOnce({
      role: {
        permissions: [
          { permission: { name: "crm.deals.view" } },
          // 'crm.deals.delete' no está en los permisos
        ],
      },
    } as any);

    const result = await hasAllPermissions(USER_ID, COMPANY_ID, [
      "crm.deals.view",
      "crm.deals.delete",
    ]);
    expect(result).toBe(false);
  });

  it("retorna false (fail safe) si la BD lanza un error", async () => {
    vi.mocked(prisma.companyUser.findFirst).mockRejectedValueOnce(
      new Error("Timeout")
    );

    const result = await hasAllPermissions(USER_ID, COMPANY_ID, ["crm.deals.view"]);
    expect(result).toBe(false);
  });
});
