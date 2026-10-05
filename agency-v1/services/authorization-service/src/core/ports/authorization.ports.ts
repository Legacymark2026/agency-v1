import {
  RoleDomain,
  PermissionDefinition,
  RoleConfigDomain,
  UserRoleAssignment,
  CompanySubscriptionDomain,
  SubscriptionVerificationResult,
} from "../domain/authorization.domain";

export interface CreateRoleDTO {
  name: string;
  companyId: string;
  description?: string | null;
  permissionIds?: string[];
  priority?: number;
  isDefault?: boolean;
}

export interface UpdateRoleDTO {
  name?: string;
  description?: string | null;
  permissionIds?: string[];
  isActive?: boolean;
  priority?: number;
  isDefault?: boolean;
}

export interface CheckPermissionDTO {
  userId: string;
  companyId: string;
  requiredPermission: string;
  userRole?: string;
  isSuperAdmin?: boolean;
  requiredTier?: string;
  skipSubscriptionCheck?: boolean;
}

export interface CheckPermissionResult {
  granted: boolean;
  reason: string;
  subscriptionCheck?: SubscriptionVerificationResult;
}

export interface ISubscriptionRepositoryPort {
  getCompanySubscription(companyId: string): Promise<CompanySubscriptionDomain | null>;
}

export interface IRoleRepositoryPort {
  listRolesByCompany(companyId: string, activeOnly?: boolean): Promise<RoleDomain[]>;
  findRoleById(id: string): Promise<RoleDomain | null>;
  createRole(dto: CreateRoleDTO): Promise<RoleDomain>;
  updateRole(id: string, dto: UpdateRoleDTO): Promise<RoleDomain>;
  deleteRole(id: string): Promise<boolean>;
  assignUserRole(assignment: UserRoleAssignment): Promise<UserRoleAssignment>;
  listUsersWithRoles(companyId: string): Promise<Array<{ id: string; name: string | null; email: string; companyRole: string }>>;
}

export interface IPermissionRepositoryPort {
  listPermissions(): Promise<PermissionDefinition[]>;
  syncPermissions(permissions: Array<{ name: string; description?: string; category?: string }>): Promise<PermissionDefinition[]>;
}

export interface IRoleConfigRepositoryPort {
  listRoleConfigs(): Promise<RoleConfigDomain[]>;
  upsertRoleConfig(config: RoleConfigDomain): Promise<RoleConfigDomain>;
  deleteRoleConfig(roleName: string): Promise<boolean>;
}

export interface IAuthorizationEventPublisherPort {
  publishAuthorizationEvent(topic: string, payload: Record<string, any>): Promise<void>;
}

