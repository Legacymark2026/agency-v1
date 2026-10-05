"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const authorization_domain_1 = require("./core/domain/authorization.domain");
const authorization_usecases_1 = require("./core/usecases/authorization.usecases");
(0, vitest_1.describe)("Authorization Service (AuthZ Engine) Tests", () => {
    const dummyRole = {
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
    (0, vitest_1.describe)("AuthorizationMatrix Domain Logic", () => {
        (0, vitest_1.it)("permits explicit permissions configured in role", () => {
            (0, vitest_1.expect)(authorization_domain_1.AuthorizationMatrix.hasPermission(dummyRole, "invoices.read")).toBe(true);
            (0, vitest_1.expect)(authorization_domain_1.AuthorizationMatrix.hasPermission(dummyRole, "invoices.create")).toBe(true);
            (0, vitest_1.expect)(authorization_domain_1.AuthorizationMatrix.hasPermission(dummyRole, "users.delete")).toBe(false);
        });
        (0, vitest_1.it)("allows super_admin full bypass", () => {
            (0, vitest_1.expect)(authorization_domain_1.AuthorizationMatrix.hasPermission(dummyRole, "users.delete", true)).toBe(true);
        });
        (0, vitest_1.it)("enforces tenant boundary strictly", () => {
            (0, vitest_1.expect)(authorization_domain_1.AuthorizationMatrix.isWithinTenantBoundary("company-100", "company-100", false)).toBe(true);
            (0, vitest_1.expect)(authorization_domain_1.AuthorizationMatrix.isWithinTenantBoundary("company-100", "company-200", false)).toBe(false);
            (0, vitest_1.expect)(authorization_domain_1.AuthorizationMatrix.isWithinTenantBoundary("company-100", "company-200", true)).toBe(true);
        });
    });
    (0, vitest_1.describe)("AuthorizationUseCases Hexagonal Orchestration", () => {
        (0, vitest_1.it)("prevents cross-tenant access during role retrieval", async () => {
            const mockRoleRepo = {
                listRolesByCompany: async () => [dummyRole],
            };
            const useCases = new authorization_usecases_1.AuthorizationUseCases(mockRoleRepo, {}, {});
            // Same tenant succeeds
            const roles = await useCases.getRolesByCompany("company-100", "company-100", false);
            (0, vitest_1.expect)(roles).toHaveLength(1);
            // Different tenant throws error
            await (0, vitest_1.expect)(useCases.getRolesByCompany("company-100", "company-999", false)).rejects.toThrow("Access denied: Tenant boundary violation");
        });
    });
    (0, vitest_1.describe)("Subscription Gatekeeper Prior Verification", () => {
        const mockRoleRepo = {
            listRolesByCompany: async () => [dummyRole],
        };
        (0, vitest_1.it)("DENIES access if company subscription is past_due or canceled before checking role", async () => {
            const mockSubRepo = {
                getCompanySubscription: async () => ({
                    companyId: "company-100",
                    subscriptionTier: "pro",
                    subscriptionStatus: "past_due",
                }),
            };
            const useCases = new authorization_usecases_1.AuthorizationUseCases(mockRoleRepo, {}, {}, mockSubRepo);
            const result = await useCases.checkPermission({
                userId: "user-1",
                companyId: "company-100",
                userRole: "Accountant",
                requiredPermission: "invoices.read",
            });
            (0, vitest_1.expect)(result.granted).toBe(false);
            (0, vitest_1.expect)(result.subscriptionCheck?.allowed).toBe(false);
            (0, vitest_1.expect)(result.subscriptionCheck?.code).toBe("SUBSCRIPTION_INACTIVE");
            (0, vitest_1.expect)(result.reason).toContain("[SUBSCRIPTION GATEKEEPER]");
        });
        (0, vitest_1.it)("DENIES access if required tier is higher than company subscription tier", async () => {
            const mockSubRepo = {
                getCompanySubscription: async () => ({
                    companyId: "company-100",
                    subscriptionTier: "starter",
                    subscriptionStatus: "active",
                }),
            };
            const useCases = new authorization_usecases_1.AuthorizationUseCases(mockRoleRepo, {}, {}, mockSubRepo);
            const result = await useCases.checkPermission({
                userId: "user-1",
                companyId: "company-100",
                userRole: "Accountant",
                requiredPermission: "invoices.read",
                requiredTier: "enterprise",
            });
            (0, vitest_1.expect)(result.granted).toBe(false);
            (0, vitest_1.expect)(result.subscriptionCheck?.code).toBe("TIER_INSUFFICIENT");
        });
        (0, vitest_1.it)("ALLOWS access when subscription is active and role has required permission", async () => {
            const mockSubRepo = {
                getCompanySubscription: async () => ({
                    companyId: "company-100",
                    subscriptionTier: "pro",
                    subscriptionStatus: "active",
                }),
            };
            const useCases = new authorization_usecases_1.AuthorizationUseCases(mockRoleRepo, {}, {}, mockSubRepo);
            const result = await useCases.checkPermission({
                userId: "user-1",
                companyId: "company-100",
                userRole: "Accountant",
                requiredPermission: "invoices.read",
            });
            (0, vitest_1.expect)(result.granted).toBe(true);
            (0, vitest_1.expect)(result.subscriptionCheck?.allowed).toBe(true);
            (0, vitest_1.expect)(result.subscriptionCheck?.code).toBe("ACTIVE");
        });
        (0, vitest_1.it)("DENIES access when subscription is active but role lacks the permission", async () => {
            const mockSubRepo = {
                getCompanySubscription: async () => ({
                    companyId: "company-100",
                    subscriptionTier: "pro",
                    subscriptionStatus: "active",
                }),
            };
            const useCases = new authorization_usecases_1.AuthorizationUseCases(mockRoleRepo, {}, {}, mockSubRepo);
            const result = await useCases.checkPermission({
                userId: "user-1",
                companyId: "company-100",
                userRole: "Accountant",
                requiredPermission: "payroll.execute",
            });
            (0, vitest_1.expect)(result.granted).toBe(false);
            (0, vitest_1.expect)(result.subscriptionCheck?.allowed).toBe(true);
            (0, vitest_1.expect)(result.reason).toContain("not granted for role");
        });
        (0, vitest_1.it)("BYPASSES subscription check for SuperAdmin", async () => {
            const mockSubRepo = {
                getCompanySubscription: async () => ({
                    companyId: "company-100",
                    subscriptionTier: "free",
                    subscriptionStatus: "canceled",
                }),
            };
            const useCases = new authorization_usecases_1.AuthorizationUseCases(mockRoleRepo, {}, {}, mockSubRepo);
            const result = await useCases.checkPermission({
                userId: "admin-super",
                companyId: "company-100",
                userRole: "super_admin",
                requiredPermission: "any.permission",
                isSuperAdmin: true,
            });
            (0, vitest_1.expect)(result.granted).toBe(true);
            (0, vitest_1.expect)(result.subscriptionCheck?.code).toBe("BYPASS_ADMIN");
        });
    });
});
