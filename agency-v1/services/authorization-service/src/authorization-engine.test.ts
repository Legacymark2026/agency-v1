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

  describe("Subscription Gatekeeper Prior Verification", () => {
    const mockRoleRepo: any = {
      listRolesByCompany: async () => [dummyRole],
    };

    it("DENIES access if company subscription is past_due or canceled before checking role", async () => {
      const mockSubRepo: any = {
        getCompanySubscription: async () => ({
          companyId: "company-100",
          subscriptionTier: "pro",
          subscriptionStatus: "past_due",
        }),
      };

      const useCases = new AuthorizationUseCases(mockRoleRepo, {} as any, {} as any, mockSubRepo);

      const result = await useCases.checkPermission({
        userId: "user-1",
        companyId: "company-100",
        userRole: "Accountant",
        requiredPermission: "invoices.read",
      });

      expect(result.granted).toBe(false);
      expect(result.subscriptionCheck?.allowed).toBe(false);
      expect(result.subscriptionCheck?.code).toBe("SUBSCRIPTION_INACTIVE");
      expect(result.reason).toContain("[SUBSCRIPTION GATEKEEPER]");
    });

    it("DENIES access if required tier is higher than company subscription tier", async () => {
      const mockSubRepo: any = {
        getCompanySubscription: async () => ({
          companyId: "company-100",
          subscriptionTier: "starter",
          subscriptionStatus: "active",
        }),
      };

      const useCases = new AuthorizationUseCases(mockRoleRepo, {} as any, {} as any, mockSubRepo);

      const result = await useCases.checkPermission({
        userId: "user-1",
        companyId: "company-100",
        userRole: "Accountant",
        requiredPermission: "invoices.read",
        requiredTier: "enterprise",
      });

      expect(result.granted).toBe(false);
      expect(result.subscriptionCheck?.code).toBe("TIER_INSUFFICIENT");
    });

    it("ALLOWS access when subscription is active and role has required permission", async () => {
      const mockSubRepo: any = {
        getCompanySubscription: async () => ({
          companyId: "company-100",
          subscriptionTier: "pro",
          subscriptionStatus: "active",
        }),
      };

      const useCases = new AuthorizationUseCases(mockRoleRepo, {} as any, {} as any, mockSubRepo);

      const result = await useCases.checkPermission({
        userId: "user-1",
        companyId: "company-100",
        userRole: "Accountant",
        requiredPermission: "invoices.read",
      });

      expect(result.granted).toBe(true);
      expect(result.subscriptionCheck?.allowed).toBe(true);
      expect(result.subscriptionCheck?.code).toBe("ACTIVE");
    });

    it("DENIES access when subscription is active but role lacks the permission", async () => {
      const mockSubRepo: any = {
        getCompanySubscription: async () => ({
          companyId: "company-100",
          subscriptionTier: "pro",
          subscriptionStatus: "active",
        }),
      };

      const useCases = new AuthorizationUseCases(mockRoleRepo, {} as any, {} as any, mockSubRepo);

      const result = await useCases.checkPermission({
        userId: "user-1",
        companyId: "company-100",
        userRole: "Accountant",
        requiredPermission: "payroll.execute",
      });

      expect(result.granted).toBe(false);
      expect(result.subscriptionCheck?.allowed).toBe(true);
      expect(result.reason).toContain("not granted for role");
    });

    it("BYPASSES subscription check for SuperAdmin", async () => {
      const mockSubRepo: any = {
        getCompanySubscription: async () => ({
          companyId: "company-100",
          subscriptionTier: "free",
          subscriptionStatus: "canceled",
        }),
      };

      const useCases = new AuthorizationUseCases(mockRoleRepo, {} as any, {} as any, mockSubRepo);

      const result = await useCases.checkPermission({
        userId: "admin-super",
        companyId: "company-100",
        userRole: "super_admin",
        requiredPermission: "any.permission",
        isSuperAdmin: true,
      });

      expect(result.granted).toBe(true);
      expect(result.subscriptionCheck?.code).toBe("BYPASS_ADMIN");
    });
  });
});

