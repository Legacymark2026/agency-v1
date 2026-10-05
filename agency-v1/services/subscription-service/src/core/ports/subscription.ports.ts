import {
  SubscriptionDomain,
  SubscriptionPlanDomain,
  DeviceTrialRecord,
  TrialEligibilityResult,
  SubscriptionTier,
  SubscriptionStatus,
} from "../domain/subscription.domain";

export interface ClaimTrialDTO {
  companyId: string;
  deviceHash: string;
  ipSubnet?: string | null;
  userAgent?: string | null;
  durationDays?: number;
}

export interface ISubscriptionRepositoryPort {
  getSubscriptionByCompanyId(companyId: string): Promise<SubscriptionDomain | null>;
  upsertSubscription(data: {
    companyId: string;
    tier: SubscriptionTier;
    status: SubscriptionStatus;
    trialStartedAt?: Date | null;
    trialEndsAt?: Date | null;
  }): Promise<SubscriptionDomain>;
}

export interface IDeviceTrialRepositoryPort {
  findRecordByDeviceHash(deviceHash: string): Promise<DeviceTrialRecord | null>;
  saveTrialClaim(record: DeviceTrialRecord): Promise<void>;
  flagAbuser(deviceHash: string, reason: string): Promise<void>;
}

export interface ISubscriptionEventPublisherPort {
  publishSubscriptionEvent(topic: string, payload: Record<string, any>): Promise<void>;
}
