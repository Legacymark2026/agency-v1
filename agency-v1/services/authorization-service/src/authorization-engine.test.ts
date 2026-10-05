import { describe, it, expect } from "vitest";
import { AuthorizationMatrix, RoleDomain } from "./core/domain/authorization.domain";
import { AuthorizationUseCases } from "./core/usecases/authorization.usecases";

describe("Authorization Service (AuthZ Engine) Tests", () => {
  const dummyRole: RoleDomain = {
    id: "role-1",
    name: "Accountant",
    companyId: "company-100",
    isActive: true,
    permissions: [
      {
        roleId: "role-1",
        permissionId: "perm-1",
        permission: { id: "perm-1", name: "invoices.read", category: "BILLING" },
      },
      {
        roleId: "role-1",
        permissionId: "perm-2",
        permission: { id: "perm-2", name: "invoices.create", category: "BILLING" },
      },
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  describe("AuthorizationMatrix Domain Logic", () => {
    it("permits explicit permissions configured in role", () => {
      expect(AuthorizationMatrix.hasPermission(dummyRole, "invoices.read")).toBe(true);
      expect(AuthorizationMatrix.hasPermission(dummyRole, "invoices.create")).toBe(true);
      expect(AuthorizationMatrix.hasPermission(dummyRole, "users.delete")).toBe(false);
    });

    it("allows super_admin full bypass", () => {
      expect(AuthorizationMatrix.hasPermission(dummyRole, "users.delete", true)).toBe(true);
    });

    it("enforces tenant boundary strictly", () => {
      expect(AuthorizationMatrix.isWithinTenantBoundary("company-100", "company-100", false)).toBe(true);
      expect(AuthorizationMatrix.isWithinTenantBoundary("company-100", "company-200", false)).toBe(false);
      expect(AuthorizationMatrix.isWithinTenantBoundary("company-100", "company-200", true)).toBe(true);
    });
  });

  describe("AuthorizationUseCases Hexagonal Orchestration", () => {
    it("prevents cross-tenant access during role retrieval", async () => {
      const mockRoleRepo: any = {
        listRolesByCompany: async () => [dummyRole],
      };
      const useCases = new AuthorizationUseCases(mockRoleRepo, {} as any, {} as any);

      // Same tenant succeeds
      const roles = await useCases.getRolesByCompany("company-100", "company-100", false);
      expect(roles).toHaveLength(1);

      // Different tenant throws error
      await expect(
        useCases.getRolesByCompany("company-100", "company-999", false)
      ).rejects.toThrow("Access denied: Tenant boundary violation");
    });
  });
});
