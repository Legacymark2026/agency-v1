"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthorizationUseCases = void 0;
const authorization_domain_1 = require("../domain/authorization.domain");
class AuthorizationUseCases {
    roleRepo;
    permRepo;
    roleConfigRepo;
    subscriptionRepo;
    eventPublisher;
    constructor(roleRepo, permRepo, roleConfigRepo, subscriptionRepo, eventPublisher) {
        this.roleRepo = roleRepo;
        this.permRepo = permRepo;
        this.roleConfigRepo = roleConfigRepo;
        this.subscriptionRepo = subscriptionRepo;
        this.eventPublisher = eventPublisher;
    }
    /**
     * Main gatekeeper method:
     * 1. Validates company subscription as mandatory prior check
     * 2. Evaluates RBAC role and granular permission assignment
     */
    async checkPermission(dto) {
        const isSuperAdmin = dto.isSuperAdmin || dto.userRole?.toLowerCase() === "super_admin";
        // ── PASO 0: SuperAdmin Bypass Inmediato ───────────────────────────────────
        if (isSuperAdmin) {
            return {
                granted: true,
                reason: "SuperAdmin bypass: full system authorization granted",
                subscriptionCheck: { allowed: true, code: "BYPASS_ADMIN" },
            };
        }
        // ── PASO 1: Verificación de Suscripción Previa (Subscription Gatekeeper) ───
        let subscription = null;
        if (dto.companyId && this.subscriptionRepo && !dto.skipSubscriptionCheck) {
            subscription = await this.subscriptionRepo.getCompanySubscription(dto.companyId);
            const subResult = authorization_domain_1.SubscriptionGatekeeper.verifySubscriptionAccess(subscription, dto.requiredTier, false);
            if (!subResult.allowed) {
                if (this.eventPublisher) {
                    await this.eventPublisher.publishAuthorizationEvent("authz.subscription.denied", {
                        userId: dto.userId,
                        companyId: dto.companyId,
                        code: subResult.code,
                        reason: subResult.reason,
                        requiredTier: dto.requiredTier,
                    }).catch((e) => console.warn("[AuthzUseCases] Event publish warning:", e.message));
                }
                return {
                    granted: false,
                    reason: `[SUBSCRIPTION GATEKEEPER] ${subResult.reason}`,
                    subscriptionCheck: subResult,
                };
            }
        }
        // ── PASO 2: Verificación de Rol y Permiso en Matriz RBAC ───────────────────
        const roles = await this.roleRepo.listRolesByCompany(dto.companyId, true);
        const matchingRole = roles.find((r) => r.name.toLowerCase() === (dto.userRole || "").toLowerCase());
        if (!matchingRole) {
            return {
                granted: false,
                reason: `Role '${dto.userRole}' not found or inactive for company ${dto.companyId}`,
                subscriptionCheck: { allowed: true, code: "ACTIVE" },
            };
        }
        const hasPerm = authorization_domain_1.AuthorizationMatrix.hasPermission(matchingRole, dto.requiredPermission, false);
        return {
            granted: hasPerm,
            reason: hasPerm
                ? "Permission granted by role"
                : `Permission '${dto.requiredPermission}' not granted for role '${dto.userRole}'`,
            subscriptionCheck: { allowed: true, code: "ACTIVE" },
        };
    }
    async getRolesByCompany(companyId, requestingUserTenantId, isSuperAdmin = false) {
        if (!authorization_domain_1.AuthorizationMatrix.isWithinTenantBoundary(companyId, requestingUserTenantId, isSuperAdmin)) {
            throw new Error("Access denied: Tenant boundary violation");
        }
        return this.roleRepo.listRolesByCompany(companyId);
    }
    async getRoleDetail(roleId, requestingUserTenantId, isSuperAdmin = false) {
        const role = await this.roleRepo.findRoleById(roleId);
        if (!role)
            return null;
        if (!authorization_domain_1.AuthorizationMatrix.isWithinTenantBoundary(role.companyId, requestingUserTenantId, isSuperAdmin)) {
            throw new Error("Access denied: Tenant boundary violation");
        }
        return role;
    }
    async createRole(dto, requestingUserTenantId, isSuperAdmin = false) {
        if (!authorization_domain_1.AuthorizationMatrix.isWithinTenantBoundary(dto.companyId, requestingUserTenantId, isSuperAdmin)) {
            throw new Error("Access denied: Tenant boundary violation");
        }
        const created = await this.roleRepo.createRole(dto);
        if (this.eventPublisher) {
            await this.eventPublisher.publishAuthorizationEvent("authz.role.created", {
                roleId: created.id,
                name: created.name,
                companyId: created.companyId,
            }).catch((e) => console.warn("[AuthzUseCases] Event publish warning:", e.message));
        }
        return created;
    }
    async updateRole(id, dto, requestingUserTenantId, isSuperAdmin = false) {
        const existing = await this.roleRepo.findRoleById(id);
        if (!existing)
            throw new Error("Role not found");
        if (!authorization_domain_1.AuthorizationMatrix.isWithinTenantBoundary(existing.companyId, requestingUserTenantId, isSuperAdmin)) {
            throw new Error("Access denied: Tenant boundary violation");
        }
        const updated = await this.roleRepo.updateRole(id, dto);
        if (this.eventPublisher) {
            await this.eventPublisher.publishAuthorizationEvent("authz.role.updated", {
                roleId: updated.id,
                name: updated.name,
                companyId: updated.companyId,
            }).catch((e) => console.warn("[AuthzUseCases] Event publish warning:", e.message));
        }
        return updated;
    }
    async deleteRole(id, requestingUserTenantId, isSuperAdmin = false) {
        const existing = await this.roleRepo.findRoleById(id);
        if (!existing)
            return false;
        if (!authorization_domain_1.AuthorizationMatrix.isWithinTenantBoundary(existing.companyId, requestingUserTenantId, isSuperAdmin)) {
            throw new Error("Access denied: Tenant boundary violation");
        }
        const ok = await this.roleRepo.deleteRole(id);
        if (ok && this.eventPublisher) {
            await this.eventPublisher.publishAuthorizationEvent("authz.role.deleted", {
                roleId: id,
                companyId: existing.companyId,
            }).catch((e) => console.warn("[AuthzUseCases] Event publish warning:", e.message));
        }
        return ok;
    }
    async assignUserRole(assignment, requestingUserTenantId, isSuperAdmin = false) {
        if (!authorization_domain_1.AuthorizationMatrix.isWithinTenantBoundary(assignment.companyId, requestingUserTenantId, isSuperAdmin)) {
            throw new Error("Access denied: Tenant boundary violation");
        }
        const result = await this.roleRepo.assignUserRole(assignment);
        if (this.eventPublisher) {
            await this.eventPublisher.publishAuthorizationEvent("authz.role.assigned", {
                userId: assignment.userId,
                roleName: assignment.roleName,
                companyId: assignment.companyId,
            }).catch((e) => console.warn("[AuthzUseCases] Event publish warning:", e.message));
        }
        return result;
    }
    async listUsersWithRoles(companyId, requestingUserTenantId, isSuperAdmin = false) {
        if (!authorization_domain_1.AuthorizationMatrix.isWithinTenantBoundary(companyId, requestingUserTenantId, isSuperAdmin)) {
            throw new Error("Access denied: Tenant boundary violation");
        }
        return this.roleRepo.listUsersWithRoles(companyId);
    }
    async listPermissions() {
        return this.permRepo.listPermissions();
    }
    async syncPermissions(permissions) {
        return this.permRepo.syncPermissions(permissions);
    }
    async listRoleConfigs() {
        return this.roleConfigRepo.listRoleConfigs();
    }
    async upsertRoleConfig(config) {
        return this.roleConfigRepo.upsertRoleConfig(config);
    }
    async deleteRoleConfig(roleName) {
        return this.roleConfigRepo.deleteRoleConfig(roleName);
    }
}
exports.AuthorizationUseCases = AuthorizationUseCases;
