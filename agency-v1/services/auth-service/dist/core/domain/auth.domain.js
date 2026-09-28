"use strict";
/**
 * Auth Service — Pure Domain Entities & RBAC Rules
 * ─────────────────────────────────────────────────────────────────────────────
 * Zero external framework dependencies.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserDomain = exports.ALLOWED_ROLES = void 0;
exports.isRoleAllowed = isRoleAllowed;
exports.evaluatePermission = evaluatePermission;
exports.ALLOWED_ROLES = ["super_admin", "admin", "manager", "agent", "client", "user"];
function isRoleAllowed(role) {
    return exports.ALLOWED_ROLES.includes(role);
}
function evaluatePermission(userRole, userPermissions, requiredPermission) {
    if (userRole === "super_admin")
        return true;
    if (userPermissions.includes("*"))
        return true;
    return userPermissions.includes(requiredPermission);
}
class UserDomain {
    id;
    email;
    role;
    companyId;
    permissions;
    isActive;
    createdAt;
    constructor(id, email, role, companyId, permissions = [], isActive = true, createdAt = new Date()) {
        this.id = id;
        this.email = email;
        this.role = role;
        this.companyId = companyId;
        this.permissions = permissions;
        this.isActive = isActive;
        this.createdAt = createdAt;
    }
    hasPermission(required) {
        return evaluatePermission(this.role, this.permissions, required);
    }
}
exports.UserDomain = UserDomain;
//# sourceMappingURL=auth.domain.js.map