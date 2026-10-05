"use strict";
/**
 * Authorization Domain — Pure Hexagonal Domain Models
 * ─────────────────────────────────────────────────────────────────────────────
 * Responsibilities:
 *   - Role entity & lifecycle
 *   - Permission definitions & granularity
 *   - Tenant boundary verification
 *   - Role assignment logic
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubscriptionGatekeeper = exports.AuthorizationMatrix = void 0;
class AuthorizationMatrix {
    /**
     * Evaluates if a role contains the specified permission code
     */
    static hasPermission(role, requiredPermission, isSuperAdmin = false) {
        if (isSuperAdmin)
            return true;
        if (role.name === "super_admin" || role.name === "SUPER_ADMIN")
            return true;
        return role.permissions.some((p) => p.permission?.name === requiredPermission || p.permission?.name === "*");
    }
    /**
     * Validates multi-tenant boundary isolation
     */
    static isWithinTenantBoundary(targetTenantId, userTenantId, isSuperAdmin = false) {
        if (isSuperAdmin)
            return true;
        if (!targetTenantId || !userTenantId)
            return false;
        return targetTenantId === userTenantId;
    }
}
exports.AuthorizationMatrix = AuthorizationMatrix;
class SubscriptionGatekeeper {
    static TIER_HIERARCHY = {
        free: 0,
        starter: 1,
        pro: 2,
        professional: 2,
        enterprise: 3,
    };
    /**
     * Statuses considered healthy and authorized for general service consumption
     */
    static isStatusActive(status) {
        if (!status)
            return false;
        const normalized = status.trim().toLowerCase();
        return normalized === "active" || normalized === "trialing";
    }
    /**
     * Verifies if company tier satisfies the required tier
     */
    static isTierSufficient(currentTier, requiredTier) {
        if (!requiredTier)
            return true;
        const curLevel = this.TIER_HIERARCHY[currentTier.trim().toLowerCase()] ?? 0;
        const reqLevel = this.TIER_HIERARCHY[requiredTier.trim().toLowerCase()] ?? 0;
        return curLevel >= reqLevel;
    }
    /**
     * Performs the mandatory prior gatekeeper evaluation for authorization
     */
    static verifySubscriptionAccess(subscription, requiredTier, isSuperAdmin = false) {
        // 1. SuperAdmin bypass
        if (isSuperAdmin) {
            return { allowed: true, code: "BYPASS_ADMIN" };
        }
        // 2. Company subscription must exist
        if (!subscription) {
            return {
                allowed: false,
                code: "SUBSCRIPTION_NOT_FOUND",
                reason: "Tenant has no registered subscription record",
            };
        }
        // 3. Status must be active or trialing
        if (!this.isStatusActive(subscription.subscriptionStatus)) {
            return {
                allowed: false,
                code: "SUBSCRIPTION_INACTIVE",
                reason: `Company subscription is ${subscription.subscriptionStatus}. Access restricted pending resolution.`,
            };
        }
        // 4. Validate tier requirements if specified
        if (requiredTier && !this.isTierSufficient(subscription.subscriptionTier, requiredTier)) {
            return {
                allowed: false,
                code: "TIER_INSUFFICIENT",
                reason: `Operation requires '${requiredTier}' plan or higher. Current plan is '${subscription.subscriptionTier}'.`,
            };
        }
        return { allowed: true, code: "ACTIVE" };
    }
}
exports.SubscriptionGatekeeper = SubscriptionGatekeeper;
