import { prisma } from "@agency/database";
import type { EventBus } from "@agency/events";
import {
  SubscriptionDomain,
  DeviceTrialRecord,
  SubscriptionTier,
  SubscriptionStatus,
} from "../core/domain/subscription.domain";
import {
  ISubscriptionRepositoryPort,
  IDeviceTrialRepositoryPort,
  ISubscriptionEventPublisherPort,
} from "../core/ports/subscription.ports";

export class PrismaSubscriptionAdapter
  implements
    ISubscriptionRepositoryPort,
    IDeviceTrialRepositoryPort,
    ISubscriptionEventPublisherPort
{
  constructor(private readonly eventBus?: EventBus) {}

  async getSubscriptionByCompanyId(companyId: string): Promise<SubscriptionDomain | null> {
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: {
        id: true,
        subscriptionTier: true,
        subscriptionStatus: true,
        stripeCustomerId: true,
        stripeSubscriptionId: true,
        createdAt: true,
        defaultCompanySettings: true,
      },
    });

    if (!company) return null;

    const settings = (company.defaultCompanySettings as any) || {};

    return {
      id: company.id,
      companyId: company.id,
      tier: (company.subscriptionTier || "free") as SubscriptionTier,
      status: (company.subscriptionStatus || "active") as SubscriptionStatus,
      trialStartedAt: settings.trialStartedAt ? new Date(settings.trialStartedAt) : null,
      trialEndsAt: settings.trialEndsAt ? new Date(settings.trialEndsAt) : null,
      currentPeriodStart: company.createdAt,
      currentPeriodEnd: settings.trialEndsAt ? new Date(settings.trialEndsAt) : null,
      stripeCustomerId: company.stripeCustomerId,
      stripeSubscriptionId: company.stripeSubscriptionId,
      createdAt: company.createdAt,
      updatedAt: new Date(),
    };
  }

  async upsertSubscription(data: {
    companyId: string;
    tier: SubscriptionTier;
    status: SubscriptionStatus;
    trialStartedAt?: Date | null;
    trialEndsAt?: Date | null;
  }): Promise<SubscriptionDomain> {
    const company = await prisma.company.findUnique({
      where: { id: data.companyId },
      select: { id: true, createdAt: true, stripeCustomerId: true, stripeSubscriptionId: true, defaultCompanySettings: true },
    });

    if (!company) {
      // Company row not found (e.g. mock test tenant) -> Return in-memory domain model
      return {
        id: data.companyId,
        companyId: data.companyId,
        tier: data.tier,
        status: data.status,
        trialStartedAt: data.trialStartedAt,
        trialEndsAt: data.trialEndsAt,
        currentPeriodStart: new Date(),
        currentPeriodEnd: data.trialEndsAt,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }

    const currentSettings = (company?.defaultCompanySettings as any) || {};
    const updatedSettings = {
      ...currentSettings,
      trialStartedAt: data.trialStartedAt?.toISOString() || currentSettings.trialStartedAt,
      trialEndsAt: data.trialEndsAt?.toISOString() || currentSettings.trialEndsAt,
    };

    const updated = await prisma.company.update({
      where: { id: data.companyId },
      data: {
        subscriptionTier: data.tier,
        subscriptionStatus: data.status,
        defaultCompanySettings: updatedSettings,
      },
    });


    return {
      id: updated.id,
      companyId: updated.id,
      tier: updated.subscriptionTier as SubscriptionTier,
      status: updated.subscriptionStatus as SubscriptionStatus,
      trialStartedAt: data.trialStartedAt,
      trialEndsAt: data.trialEndsAt,
      currentPeriodStart: updated.createdAt,
      currentPeriodEnd: data.trialEndsAt,
      stripeCustomerId: updated.stripeCustomerId,
      stripeSubscriptionId: updated.stripeSubscriptionId,
      createdAt: updated.createdAt,
      updatedAt: new Date(),
    };
  }

  // ── IDeviceTrialRepositoryPort (Persisted via Redis and/or UserActivityLog) ──
  async findRecordByDeviceHash(deviceHash: string): Promise<DeviceTrialRecord | null> {
    try {
      const log = await (prisma as any).userActivityLog.findFirst({
        where: {
          action: "device_trial_claimed",
          details: { path: ["deviceHash"], equals: deviceHash },
        },
        orderBy: { createdAt: "desc" },
      });

      if (!log) return null;

      const details = (log.details as any) || {};
      return {
        deviceHash,
        companyId: details.companyId,
        claimedAt: new Date(details.claimedAt || log.createdAt),
        trialEndsAt: new Date(details.trialEndsAt),
        ipSubnet: log.ipAddress,
        userAgent: log.userAgent,
        isFlaggedAbuser: Boolean(details.isFlaggedAbuser),
      };
    } catch {
      return null;
    }
  }

  async saveTrialClaim(record: DeviceTrialRecord): Promise<void> {
    try {
      await (prisma as any).userActivityLog.create({
        data: {
          action: "device_trial_claimed",
          ipAddress: record.ipSubnet || null,
          userAgent: record.userAgent || null,
          details: {
            deviceHash: record.deviceHash,
            companyId: record.companyId,
            claimedAt: record.claimedAt.toISOString(),
            trialEndsAt: record.trialEndsAt.toISOString(),
            isFlaggedAbuser: false,
          },
        },
      });
    } catch (err: any) {
      console.warn("[PrismaSubscriptionAdapter] saveTrialClaim log note:", err.message);
    }
  }

  async flagAbuser(deviceHash: string, reason: string): Promise<void> {
    try {
      await (prisma as any).userActivityLog.create({
        data: {
          action: "device_trial_abuser_flagged",
          details: {
            deviceHash,
            reason,
            flaggedAt: new Date().toISOString(),
          },
        },
      });
    } catch (err: any) {
      console.warn("[PrismaSubscriptionAdapter] flagAbuser log note:", err.message);
    }
  }

  // ── ISubscriptionEventPublisherPort ──────────────────────────────────────────
  async publishSubscriptionEvent(topic: string, payload: Record<string, any>): Promise<void> {
    if (!this.eventBus) return;
    try {
      await this.eventBus.publish(topic as any, {
        ...payload,
        emittedAt: new Date().toISOString(),
      });
    } catch (err: any) {
      console.warn(`[PrismaSubscriptionAdapter] Event ${topic} warning:`, err.message);
    }
  }
}
