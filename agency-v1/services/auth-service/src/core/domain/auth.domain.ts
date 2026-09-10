/**
 * Auth Service — Pure Domain Entities & RBAC Rules
 * ─────────────────────────────────────────────────────────────────────────────
 * Zero external framework dependencies.
 */

export const ALLOWED_ROLES = ["super_admin", "admin", "manager", "agent", "client", "user"] as const;
export type UserRole = (typeof ALLOWED_ROLES)[number];

export function isRoleAllowed(role: string): boolean {
  return ALLOWED_ROLES.includes(role as any);
}

export function evaluatePermission(
  userRole: string,
  userPermissions: string[],
  requiredPermission: string
): boolean {
  if (userRole === "super_admin") return true;
  if (userPermissions.includes("*")) return true;
  return userPermissions.includes(requiredPermission);
}

export class UserDomain {
  constructor(
    public readonly id: string,
    public readonly email: string,
    public readonly role: UserRole,
    public readonly companyId?: string,
    public readonly permissions: string[] = [],
    public readonly isActive: boolean = true,
    public readonly createdAt: Date = new Date()
  ) {}

  public hasPermission(required: string): boolean {
    return evaluatePermission(this.role, this.permissions, required);
  }
}
