/**
 * Auth Service — Pure Domain Entities & RBAC Rules
 * ─────────────────────────────────────────────────────────────────────────────
 * Zero external framework dependencies.
 */
export declare const ALLOWED_ROLES: readonly ["super_admin", "admin", "manager", "agent", "client", "user"];
export type UserRole = (typeof ALLOWED_ROLES)[number];
export declare function isRoleAllowed(role: string): boolean;
export declare function evaluatePermission(userRole: string, userPermissions: string[], requiredPermission: string): boolean;
export declare class UserDomain {
    readonly id: string;
    readonly email: string;
    readonly role: UserRole;
    readonly companyId?: string | undefined;
    readonly permissions: string[];
    readonly isActive: boolean;
    readonly createdAt: Date;
    constructor(id: string, email: string, role: UserRole, companyId?: string | undefined, permissions?: string[], isActive?: boolean, createdAt?: Date);
    hasPermission(required: string): boolean;
}
