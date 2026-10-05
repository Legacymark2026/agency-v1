import {
  SubscriptionDomain,
  DeviceTrialRecord,
  SubscriptionAntiAbuseEngine,
  TrialEligibilityResult,
} from "../domain/subscription.domain";
import {
  ISubscriptionRepositoryPort,
  IDeviceTrialRepositoryPort,
  ISubscriptionEventPublisherPort,
  ClaimTrialDTO,
} from "../ports/subscription.ports";

export class SubscriptionUseCases {
  constructor(
    private readonly subRepo: ISubscriptionRepositoryPort,
    private readonly deviceRepo: IDeviceTrialRepositoryPort,
    private readonly eventPublisher?: ISubscriptionEventPublisherPort
  ) {}

  /**
   * Evaluates if a device and company are eligible for a free trial
   */
  async checkEligibility(companyId: string, deviceHash: string): Promise<TrialEligibilityResult> {
    const existingSub = await this.subRepo.getSubscriptionByCompanyId(companyId);
    const companyHadTrial = Boolean(existingSub?.trialStartedAt);
    const existingDevice = await this.deviceRepo.findRecordByDeviceHash(deviceHash);

    return SubscriptionAntiAbuseEngine.evaluateTrialEligibility(
      deviceHash,
      companyId,
      existingDevice,
      companyHadTrial
    );
  }

  /**
   * Claims a promotional free trial enforcing device fingerprinting
   */
  async claimFreeTrial(dto: ClaimTrialDTO): Promise<{
    success: boolean;
    subscription?: SubscriptionDomain;
    trialEndsAt?: Date;
    error?: string;
  }> {
    const eligibility = await this.checkEligibility(dto.companyId, dto.deviceHash);

    if (!eligibility.eligible) {
      // Flag device as potential abuse if it collided with a different workspace
      if (eligibility.existingRecord && eligibility.existingRecord.companyId !== dto.companyId) {
        await this.deviceRepo.flagAbuser(dto.deviceHash, eligibility.reason);
      }

      if (this.eventPublisher) {
        await this.eventPublisher.publishSubscriptionEvent("subscription.trial.denied", {
          companyId: dto.companyId,
          deviceHash: dto.deviceHash,
          reason: eligibility.reason,
        }).catch(() => {});
      }

      return {
        success: false,
        error: eligibility.reason,
      };
    }

    const durationDays = dto.durationDays || SubscriptionAntiAbuseEngine.DEFAULT_TRIAL_DAYS;
    const now = new Date();
    const trialEndsAt = SubscriptionAntiAbuseEngine.calculateTrialExpiration(durationDays);

    // Save device ledger entry
    const trialRecord: DeviceTrialRecord = {
      deviceHash: dto.deviceHash,
      companyId: dto.companyId,
      claimedAt: now,
      trialEndsAt,
      ipSubnet: dto.ipSubnet,
      userAgent: dto.userAgent,
      isFlaggedAbuser: false,
    };
    await this.deviceRepo.saveTrialClaim(trialRecord);

    // Update Company subscription state
    const subscription = await this.subRepo.upsertSubscription({
      companyId: dto.companyId,
      tier: "pro", // Trial grants Pro tier features during trial window
      status: "trialing",
      trialStartedAt: now,
      trialEndsAt,
    });

    if (this.eventPublisher) {
      await this.eventPublisher.publishSubscriptionEvent("subscription.trial.started", {
        companyId: dto.companyId,
        deviceHash: dto.deviceHash,
        trialEndsAt: trialEndsAt.toISOString(),
      }).catch(() => {});
    }

    return {
      success: true,
      subscription,
      trialEndsAt,
    };
  }

  /**
   * Retrieves live subscription details
   */
  async getSubscriptionDetails(companyId: string): Promise<SubscriptionDomain | null> {
    return this.subRepo.getSubscriptionByCompanyId(companyId);
  }
}
