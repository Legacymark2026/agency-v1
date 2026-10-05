/**
 * Subscription Domain — Pure Hexagonal Domain Models
 * ─────────────────────────────────────────────────────────────────────────────
 * Core concepts:
 *   - Subscription lifecycles (FREE, STARTER, PRO, ENTERPRISE)
 *   - Status transitions (active, trialing, past_due, canceled)
 *   - Free trial duration & expiration rules
 *   - Device Fingerprint Ledger & Anti-Abuse enforcement
 */

export type SubscriptionTier = "free" | "starter" | "pro" | "enterprise";

export type SubscriptionStatus =
  | "active"
  | "trialing"
  | "past_due"
  | "canceled"
  | "unpaid"
  | "incomplete"
  | "suspended";

export interface SubscriptionPlanDomain {
  id: string;
  name: string;
  tier: SubscriptionTier;
  priceMonthly: number;
  trialDaysAllowed: number;
  maxUsers: number;
  maxInvoicesMonthly: number;
  features: string[];
}

export interface SubscriptionDomain {
  id: string;
  companyId: string;
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  trialStartedAt?: Date | null;
  trialEndsAt?: Date | null;
  currentPeriodStart: Date;
  currentPeriodEnd?: Date | null;
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface DeviceTrialRecord {
  deviceHash: string;
  companyId: string;
  claimedAt: Date;
  trialEndsAt: Date;
  ipSubnet?: string | null;
  userAgent?: string | null;
  isFlaggedAbuser: boolean;
}

export interface TrialEligibilityResult {
  eligible: boolean;
  reason: string;
  existingRecord?: DeviceTrialRecord | null;
}

export class SubscriptionAntiAbuseEngine {
  public static readonly DEFAULT_TRIAL_DAYS = 14;

  /**
   * Evaluates if a given device fingerprint is eligible for a new free trial.
   * STRICT ANTI-ABUSE RULE:
   * A physical device hash can ONLY claim ONE trial across the platform lifetime.
   */
  public static evaluateTrialEligibility(
    deviceHash: string,
    targetCompanyId: string,
    existingDeviceRecord: DeviceTrialRecord | null,
    companyAlreadyHadTrial: boolean
  ): TrialEligibilityResult {
    if (!deviceHash || deviceHash.length < 16) {
      return {
        eligible: false,
        reason: "INVALID_DEVICE_FINGERPRINT: Device signals could not be verified securely",
      };
    }

    // 1. Verify if the target company already used their free trial
    if (companyAlreadyHadTrial) {
      return {
        eligible: false,
        reason: "COMPANY_TRIAL_ALREADY_USED: This workspace has already consumed its free trial period.",
      };
    }

    // 2. Verify device collision across other companies/workspaces
    if (existingDeviceRecord) {
      if (existingDeviceRecord.companyId !== targetCompanyId) {
        return {
          eligible: false,
          reason: `DEVICE_COLLISION_DETECTED: Hardware fingerprint was already used on workspace '${existingDeviceRecord.companyId}' on ${existingDeviceRecord.claimedAt.toISOString().slice(0, 10)}. Creation of multiple free trial accounts is restricted.`,
          existingRecord: existingDeviceRecord,
        };
      }

      // Same company: check if expired
      if (existingDeviceRecord.trialEndsAt.getTime() < Date.now()) {
        return {
          eligible: false,
          reason: "TRIAL_EXPIRED: Free trial duration has ended for this device and company.",
          existingRecord: existingDeviceRecord,
        };
      }
    }

    return {
      eligible: true,
      reason: "ELIGIBLE: Device and company qualify for promotional SaaS trial.",
    };
  }

  /**
   * Calculates trial expiration date based on duration
   */
  public static calculateTrialExpiration(days = this.DEFAULT_TRIAL_DAYS): Date {
    const expiration = new Date();
    expiration.setDate(expiration.getDate() + days);
    return expiration;
  }
}
