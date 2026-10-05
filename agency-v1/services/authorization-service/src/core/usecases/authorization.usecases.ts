import {
  RoleDomain,
  PermissionDefinition,
  RoleConfigDomain,
  UserRoleAssignment,
  AuthorizationMatrix,
  SubscriptionGatekeeper,
  CompanySubscriptionDomain,
} from "../domain/authorization.domain";
import {
  IRoleRepositoryPort,
  IPermissionRepositoryPort,
  IRoleConfigRepositoryPort,
  ISubscriptionRepositoryPort,
  IAuthorizationEventPublisherPort,
  CreateRoleDTO,
  UpdateRoleDTO,
  CheckPermissionDTO,
  CheckPermissionResult,
} from "../ports/authorization.ports";

export class AuthorizationUseCases {
  constructor(
    private readonly roleRepo: IRoleRepositoryPort,
    private readonly permRepo: IPermissionRepositoryPort,
    private readonly roleConfigRepo: IRoleConfigRepositoryPort,
    private readonly subscriptionRepo?: ISubscriptionRepositoryPort,
    private readonly eventPublisher?: IAuthorizationEventPublisherPort
  ) {}

  /**
   * Main gatekeeper method:
   * 1. Validates company subscription as mandatory prior check
   * 2. Evaluates RBAC role and granular permission assignment
   */
  async checkPermission(dto: CheckPermissionDTO): Promise<CheckPermissionResult> {
    const isSuperAdmin = dto.isSuperAdmin || dto.userRole?.toLowerCase() === "super_admin";

    // ── PASO 0: SuperAdmin Bypass Inmediato ───────────────────────────────────
    if (isSuperAdmin) {
      return {
        granted: true,
        reason: "SuperAdmin bypass: full system authorization granted",
        subscriptionCheck: { allowed: true, code: "BYPASS_ADMIN" },
      };
    }

    // ── PASO 1: Verificación de Suscripción Previa (Subscription Gatekeeper con Gracia) ───
    let subscription: CompanySubscriptionDomain | null = null;
    if (dto.companyId && this.subscriptionRepo && !dto.skipSubscriptionCheck) {
      try {
        const timeoutMs = 400;
        subscription = await Promise.race([
          this.subscriptionRepo.getCompanySubscription(dto.companyId),
          new Promise<null>((_, reject) =>
            setTimeout(() => reject(new Error("Subscription check timed out (400ms threshold)")), timeoutMs)
          ),
        ]);
      } catch (err: any) {
        console.warn(`[AuthzUseCases] SubscriptionRepo error/timeout for tenant ${dto.companyId}: ${err.message}. Engaging Grace Policy.`);
        // Resilient Degraded Grace Mode: if non-destructive action, grant conditional pass
        if (dto.requiredPermission.includes(".read") || dto.requiredPermission.includes(".list")) {
          subscription = {
            companyId: dto.companyId,
            subscriptionTier: "pro",
            subscriptionStatus: "active",
          };
        }
      }

      const subResult = SubscriptionGatekeeper.verifySubscriptionAccess(
        subscription,
        dto.requiredTier,
        false
      );

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
    const matchingRole = roles.find(
      (r) => r.name.toLowerCase() === (dto.userRole || "").toLowerCase()
    );

    if (!matchingRole) {
      return {
        granted: false,
        reason: `Role '${dto.userRole}' not found or inactive for company ${dto.companyId}`,
        subscriptionCheck: { allowed: true, code: "ACTIVE" },
      };
    }

    const hasPerm = AuthorizationMatrix.hasPermission(matchingRole, dto.requiredPermission, false);

    return {
      granted: hasPerm,
      reason: hasPerm
        ? "Permission granted by role"
        : `Permission '${dto.requiredPermission}' not granted for role '${dto.userRole}'`,
      subscriptionCheck: { allowed: true, code: "ACTIVE" },
    };
  }


  async getRolesByCompany(companyId: string, requestingUserTenantId?: string, isSuperAdmin = false): Promise<RoleDomain[]> {
    if (!AuthorizationMatrix.isWithinTenantBoundary(companyId, requestingUserTenantId, isSuperAdmin)) {
      throw new Error("Access denied: Tenant boundary violation");
    }
    return this.roleRepo.listRolesByCompany(companyId);
  }

  async getRoleDetail(roleId: string, requestingUserTenantId?: string, isSuperAdmin = false): Promise<RoleDomain | null> {
    const role = await this.roleRepo.findRoleById(roleId);
    if (!role) return null;

    if (!AuthorizationMatrix.isWithinTenantBoundary(role.companyId, requestingUserTenantId, isSuperAdmin)) {
      throw new Error("Access denied: Tenant boundary violation");
    }
    return role;
  }

  async createRole(dto: CreateRoleDTO, requestingUserTenantId?: string, isSuperAdmin = false): Promise<RoleDomain> {
    if (!AuthorizationMatrix.isWithinTenantBoundary(dto.companyId, requestingUserTenantId, isSuperAdmin)) {
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

  async updateRole(id: string, dto: UpdateRoleDTO, requestingUserTenantId?: string, isSuperAdmin = false): Promise<RoleDomain> {
    const existing = await this.roleRepo.findRoleById(id);
    if (!existing) throw new Error("Role not found");

    if (!AuthorizationMatrix.isWithinTenantBoundary(existing.companyId, requestingUserTenantId, isSuperAdmin)) {
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

  async deleteRole(id: string, requestingUserTenantId?: string, isSuperAdmin = false): Promise<boolean> {
    const existing = await this.roleRepo.findRoleById(id);
    if (!existing) return false;

    if (!AuthorizationMatrix.isWithinTenantBoundary(existing.companyId, requestingUserTenantId, isSuperAdmin)) {
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

  async assignUserRole(assignment: UserRoleAssignment, requestingUserTenantId?: string, isSuperAdmin = false): Promise<UserRoleAssignment> {
    if (!AuthorizationMatrix.isWithinTenantBoundary(assignment.companyId, requestingUserTenantId, isSuperAdmin)) {
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

  async listUsersWithRoles(companyId: string, requestingUserTenantId?: string, isSuperAdmin = false) {
    if (!AuthorizationMatrix.isWithinTenantBoundary(companyId, requestingUserTenantId, isSuperAdmin)) {
      throw new Error("Access denied: Tenant boundary violation");
    }
    return this.roleRepo.listUsersWithRoles(companyId);
  }

  async listPermissions(): Promise<PermissionDefinition[]> {
    return this.permRepo.listPermissions();
  }

  async syncPermissions(permissions: Array<{ name: string; description?: string; category?: string }>) {
    return this.permRepo.syncPermissions(permissions);
  }

  async listRoleConfigs(): Promise<RoleConfigDomain[]> {
    return this.roleConfigRepo.listRoleConfigs();
  }

  async upsertRoleConfig(config: RoleConfigDomain): Promise<RoleConfigDomain> {
    return this.roleConfigRepo.upsertRoleConfig(config);
  }

  async deleteRoleConfig(roleName: string): Promise<boolean> {
    return this.roleConfigRepo.deleteRoleConfig(roleName);
  }
}
