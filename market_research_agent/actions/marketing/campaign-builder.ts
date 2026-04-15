'use server';

import { db as prisma } from '@/lib/db';
import { auth } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { UserRole } from '@/types/auth';

import { createFacebookAdSet } from './facebook-dispatch';
import { createTikTokCampaign } from './tiktok-dispatch';
import { createGoogleCampaign } from './google-dispatch';
import { createLinkedInCampaign } from './linkedin-dispatch';
import { validateCampaignAllPlatforms, ValidationResult } from '@/lib/validators/platform-validators';

// ─── VALIDATE CAMPAIGN (Pre-Flight Check) ────────────────────────────────────

/**
 * Validates a campaign against all its target platforms before launch.
 * Returns an array of ValidationResult — one per platform.
 */
export async function validateCampaign(campaignId: string): Promise<ValidationResult[]> {
    const campaign = await prisma.campaign.findUnique({
        where: { id: campaignId },
        select: { platform: true, budget: true, parameters: true },
    });
    if (!campaign) throw new Error('Campaign not found');

    return validateCampaignAllPlatforms({
        platform: campaign.platform,
        budget: campaign.budget,
        parameters: campaign.parameters as Record<string, unknown> | null,
    });
}

// ─── MULTI-PLATFORM LAUNCH ───────────────────────────────────────────────────

export type PlatformKey = 'FACEBOOK_ADS' | 'GOOGLE_ADS' | 'TIKTOK_ADS' | 'LINKEDIN_ADS';

export interface PlatformLaunchResult {
    platform: PlatformKey;
    success: boolean;
    externalId?: string;
    error?: string;
}

/**
 * Launches the same campaign to multiple platforms simultaneously.
 * Uses Promise.allSettled — a failure on one platform doesn't block others.
 */
export async function launchMultiPlatformCampaign(
    campaignId: string,
    platforms: PlatformKey[]
): Promise<PlatformLaunchResult[]> {
    const session = await auth();
    if (!session?.user?.id) throw new Error('Unauthorized');

    const campaign = await prisma.campaign.findUnique({ where: { id: campaignId } });
    if (!campaign) throw new Error('Campaign not found');

    // Run pre-flight validation
    const validations = await validateCampaignAllPlatforms({
        platform: platforms.join(','),
        budget: campaign.budget,
        parameters: campaign.parameters as Record<string, unknown> | null,
    });

    const hasBlockingErrors = validations.some(v => !v.valid);
    if (hasBlockingErrors) {
        const errorMessages = validations
            .flatMap(v => v.errors.filter(e => e.severity === 'ERROR').map(e => `[${v.platform}] ${e.message}`))
            .join('; ');
        throw new Error(`Pre-flight validation failed: ${errorMessages}`);
    }

    const launchPayload = {
        name: campaign.name,
        parameters: campaign.parameters,
        dailyBudget: campaign.budget,
    };

    const results = await Promise.allSettled(
        platforms.map(async (platform): Promise<PlatformLaunchResult> => {
            switch (platform) {
                case 'FACEBOOK_ADS': {
                    const r = await createFacebookAdSet(launchPayload);
                    return { platform, success: true, externalId: r.campaignId as string };
                }
                case 'GOOGLE_ADS': {
                    const r = await createGoogleCampaign(launchPayload);
                    return { platform, success: true, externalId: r.campaignId as string };
                }
                case 'TIKTOK_ADS': {
                    const r = await createTikTokCampaign(launchPayload);
                    return { platform, success: true, externalId: r.campaignId as string };
                }
                case 'LINKEDIN_ADS': {
                    const r = await createLinkedInCampaign(launchPayload);
                    return { platform, success: true, externalId: r.campaignId as string };
                }
            }
        })
    );

    // Map settled results
    const mapped = results.map((r, i): PlatformLaunchResult => {
        if (r.status === 'fulfilled') return r.value;
        return {
            platform: platforms[i],
            success: false,
            error: (r.reason as Error)?.message ?? 'Unknown error',
        };
    });

    // Update DB: mark as LAUNCHED if at least one succeeded
    const anySuccess = mapped.some(r => r.success);
    if (anySuccess) {
        await prisma.campaign.update({
            where: { id: campaignId },
            data: {
                launchStatus: 'LAUNCHED',
                status: 'ACTIVE',
                launchedAt: new Date(),
            },
        });
        revalidatePath('/dashboard/admin/marketing/campaigns');
    } else {
        await prisma.campaign.update({
            where: { id: campaignId },
            data: { launchStatus: 'FAILED' },
        });
    }

    return mapped;
}


export async function saveCampaignDraft(data: {
    name: string;
    platform: string;
    budget: number;
    startDate?: string;
    endDate?: string;
    description?: string;
    parameters: any;
    trackingConfig: any;
    campaignId?: string;
}) {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");

    const companyUser = await prisma.companyUser.findFirst({
        where: { userId: session.user.id },
        select: { companyId: true }
    });
    if (!companyUser) throw new Error("Company not found");

    const { campaignId, ...campaignData } = data;

    if (campaignId) {
        // Update existing draft
        const updated = await prisma.campaign.update({
            where: { id: campaignId, companyId: companyUser.companyId },
            data: {
                ...campaignData,
                startDate: data.startDate ? new Date(data.startDate) : null,
                endDate: data.endDate ? new Date(data.endDate) : null,
            }
        });
        return { success: true, id: updated.id };
    } else {
        // Create new draft
        const created = await prisma.campaign.create({
            data: {
                ...campaignData,
                code: `DRAFT-${Date.now()}`,
                status: 'DRAFT',
                approvalStatus: 'DRAFT',
                launchStatus: 'PENDING',
                companyId: companyUser.companyId,
                startDate: data.startDate ? new Date(data.startDate) : null,
                endDate: data.endDate ? new Date(data.endDate) : null,
            }
        });
        return { success: true, id: created.id };
    }
}

export async function submitForApproval(campaignId: string) {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");

    await prisma.campaign.update({
        where: { id: campaignId },
        data: { approvalStatus: 'PENDING_APPROVAL' }
    });

    revalidatePath('/dashboard/admin/marketing/approvals');
    return { success: true };
}

export async function updateApprovalStatus(campaignId: string, status: 'APPROVED' | 'REJECTED', note?: string) {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");

    // Must be admin or have permissions to approve
    if (session.user.role !== UserRole.SUPER_ADMIN && session.user.role !== UserRole.CLIENT_ADMIN) {
        throw new Error("Unauthorized to approve campaigns");
    }

    const campaign = await prisma.campaign.update({
        where: { id: campaignId },
        data: {
            approvalStatus: status,
            approvedById: status === 'APPROVED' ? session.user.id : null,
        }
    });

    revalidatePath('/dashboard/admin/marketing/approvals');
    revalidatePath('/dashboard/admin/marketing/campaigns');

    // Optionally log the activity with the note...

    return { success: true, campaign };
}

export async function launchCampaign(campaignId: string) {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");

    const campaign = await prisma.campaign.findUnique({
        where: { id: campaignId }
    });

    if (!campaign) throw new Error("Campaign not found");
    if (campaign.approvalStatus !== 'APPROVED') {
        throw new Error("Campaign must be approved before launching");
    }

    // Setting status to launching
    await prisma.campaign.update({
        where: { id: campaignId },
        data: { launchStatus: 'LAUNCHING' }
    });

    try {
        let platformCampaignId = campaign.code; // Default to keep current if failed

        // Handle specific API Launching
        switch (campaign.platform) {
            case 'FACEBOOK_ADS':
                const fbResult = await createFacebookAdSet({
                    name: campaign.name,
                    parameters: campaign.parameters,
                    dailyBudget: campaign.budget, // Assume daily for now, form has lifetime logic
                });
                platformCampaignId = fbResult.campaignId as string;
                break
            case 'TIKTOK_ADS':
                const tkResult = await createTikTokCampaign({
                    name: campaign.name,
                    parameters: campaign.parameters,
                    dailyBudget: campaign.budget,
                });
                platformCampaignId = tkResult.campaignId as string;
                break;
            case 'GOOGLE_ADS':
                const ggResult = await createGoogleCampaign({
                    name: campaign.name,
                    parameters: campaign.parameters,
                    dailyBudget: campaign.budget,
                });
                platformCampaignId = ggResult.campaignId as string;
                break;
            case 'LINKEDIN_ADS':
                const liResult = await createLinkedInCampaign({
                    name: campaign.name,
                    parameters: campaign.parameters,
                    dailyBudget: campaign.budget,
                });
                platformCampaignId = liResult.campaignId as string;
                break;
            default:
                throw new Error("Unsupported platform");
        }

        // Updating with launched info
        await prisma.campaign.update({
            where: { id: campaignId },
            data: {
                code: platformCampaignId, // Updating external ID
                launchStatus: 'LAUNCHED',
                status: 'ACTIVE',
                launchedAt: new Date()
            }
        });

        revalidatePath('/dashboard/admin/marketing/campaigns');
        return { success: true };
    } catch (error: any) {
        await prisma.campaign.update({
            where: { id: campaignId },
            data: { launchStatus: 'FAILED' }
        });
        console.error("Failed to launch campaign:", error);
        throw new Error(`Failed to launch campaign to platform: ${error.message}`);
    }
}
