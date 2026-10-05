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

export type SubscriptionStatus =
  | "active"
  | "trialing"
  | "past_due"
  | "canceled"
  | "unpaid"
  | "incomplete"
  | "suspended"
  | string;

export type SubscriptionTierLevel = "free" | "starter" | "pro" | "professional" | "enterprise";

export interface CompanySubscriptionDomain {
  companyId: string;
  subscriptionTier: string;
  subscriptionStatus: SubscriptionStatus;
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
}

export interface SubscriptionVerificationResult {
  allowed: boolean;
  reason?: string;
  code?: "ACTIVE" | "SUBSCRIPTION_INACTIVE" | "SUBSCRIPTION_NOT_FOUND" | "TIER_INSUFFICIENT" | "BYPASS_ADMIN";
}

export class SubscriptionGatekeeper {
  private static readonly TIER_HIERARCHY: Record<string, number> = {
    free: 0,
    starter: 1,
    pro: 2,
    professional: 2,
    enterprise: 3,
  };

  /**
   * Statuses considered healthy and authorized for general service consumption
   */
  public static isStatusActive(status?: string | null): boolean {
    if (!status) return false;
    const normalized = status.trim().toLowerCase();
    return normalized === "active" || normalized === "trialing";
  }

  /**
   * Verifies if company tier satisfies the required tier
   */
  public static isTierSufficient(currentTier: string, requiredTier?: string | null): boolean {
    if (!requiredTier) return true;
    const curLevel = this.TIER_HIERARCHY[currentTier.trim().toLowerCase()] ?? 0;
    const reqLevel = this.TIER_HIERARCHY[requiredTier.trim().toLowerCase()] ?? 0;
    return curLevel >= reqLevel;
  }

  /**
   * Performs the mandatory prior gatekeeper evaluation for authorization
   */
  public static verifySubscriptionAccess(
    subscription: CompanySubscriptionDomain | null,
    requiredTier?: string | null,
    isSuperAdmin: boolean = false
  ): SubscriptionVerificationResult {
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

