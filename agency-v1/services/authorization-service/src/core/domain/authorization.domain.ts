/**
 * Authorization Domain — Pure Hexagonal Domain Models
 * ─────────────────────────────────────────────────────────────────────────────
 * Responsibilities:
 *   - Role entity & lifecycle
 *   - Permission definitions & granularity
 *   - Tenant boundary verification
 *   - Role assignment logic
 */

export interface PermissionDefinition {
  id: string;
  name: string;
  description?: string | null;
  category: string;
}

export interface RolePermissionRelation {
  roleId: string;
  permissionId: string;
  permission?: PermissionDefinition;
}

export interface RoleDomain {
  id: string;
  name: string;
  companyId: string;
  description?: string | null;
  isActive: boolean;
  priority?: number;
  isDefault?: boolean;
  permissions: RolePermissionRelation[];
  createdAt: Date;
  updatedAt: Date;
}

export interface RoleConfigDomain {
  roleName: string;
  allowedRoutes: string[];
  description?: string | null;
}

export interface UserRoleAssignment {
  userId: string;
  companyId: string;
  roleName: string;
  assignedAt?: Date;
}

export class AuthorizationMatrix {
  /**
   * Evaluates if a role contains the specified permission code
   */
  public static hasPermission(
    role: RoleDomain,
    requiredPermission: string,
    isSuperAdmin: boolean = false
  ): boolean {
    if (isSuperAdmin) return true;
    if (role.name === "super_admin" || role.name === "SUPER_ADMIN") return true;

    return role.permissions.some(
      (p) => p.permission?.name === requiredPermission || p.permission?.name === "*"
    );
  }

  /**
   * Validates multi-tenant boundary isolation
   */
  public static isWithinTenantBoundary(
    targetTenantId: string,
    userTenantId?: string,
    isSuperAdmin: boolean = false
  ): boolean {
    if (isSuperAdmin) return true;
    if (!targetTenantId || !userTenantId) return false;
    return targetTenantId === userTenantId;
  }
}
