import {
  RoleDomain,
  PermissionDefinition,
  RoleConfigDomain,
  UserRoleAssignment,
  AuthorizationMatrix,
} from "../domain/authorization.domain";
import {
  IRoleRepositoryPort,
  IPermissionRepositoryPort,
  IRoleConfigRepositoryPort,
  IAuthorizationEventPublisherPort,
  CreateRoleDTO,
  UpdateRoleDTO,
} from "../ports/authorization.ports";

export class AuthorizationUseCases {
  constructor(
    private readonly roleRepo: IRoleRepositoryPort,
    private readonly permRepo: IPermissionRepositoryPort,
    private readonly roleConfigRepo: IRoleConfigRepositoryPort,
    private readonly eventPublisher?: IAuthorizationEventPublisherPort
  ) {}

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
