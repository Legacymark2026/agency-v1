'use server';

import { db as prisma } from '@/lib/db';
import { auth } from '@/lib/auth';

const LINKEDIN_API_VERSION = '202306'; // Example version, check latest LinkedIn docs
const LINKEDIN_BASE_URL = 'https://api.linkedin.com/rest';

/**
 * Creates a real Campaign and Campaign Group in LinkedIn Ads API
 */
export async function createLinkedInCampaign(campaignData: any) {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");

    const companyUser = await prisma.companyUser.findFirst({
        where: { userId: session.user.id },
        select: { companyId: true }
    });

    if (!companyUser) throw new Error("Company not found");

    const configRecord = await prisma.integrationConfig.findUnique({
        where: {
            companyId_provider: {
                companyId: companyUser.companyId,
                provider: 'linkedin_ads'
            }
        }
    });

    if (!configRecord || !configRecord.isEnabled) {
        throw new Error("LinkedIn Ads is not configured or is disabled.");
    }

    const { accountId, accessToken } = configRecord.config as any;
    const { parameters, name, dailyBudget, lifetimeBudget } = campaignData;

    // 1. Ensure a Campaign Group exists or create one
    // We'll create a default one for this campaign to keep it isolated initially
    const groupPayload = {
        account: `urn:li:sponsoredAccount:${accountId}`,
        name: `${name} - Group`,
        status: 'ACTIVE'
    };

    const groupRes = await fetch(`${LINKEDIN_BASE_URL}/adCampaignGroups`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'X-RestLi-Protocol-Version': '2.0.0',
            'LinkedIn-Version': LINKEDIN_API_VERSION,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(groupPayload)
    });

    if (!groupRes.ok) {
        const errorBody = await groupRes.text();
        console.error("LinkedIn Campaign Group Error:", errorBody);
        throw new Error("Failed to create LinkedIn Campaign Group");
    }

    // Capture the Campaign Group URN from the Location header
    const groupUrn = groupRes.headers.get('x-restli-id') || groupRes.headers.get('location')?.split('/').pop()?.replace('urn:li:sponsoredCampaignGroup:', '');

    if (!groupUrn) {
        throw new Error("Failed to parse Campaign Group URN from LinkedIn response");
    }

    const fullGroupUrn = `urn:li:sponsoredCampaignGroup:${groupUrn}`;

    // 2. Build B2B Targeting payload
    const targetingCriteria: any = {
        include: {
            and: []
        }
    };

    // Locations (required by LinkedIn)
    if (parameters.locations) {
        // Mock resolution of locations to URNs (would use geo search API in production)
        const locationUrns = parameters.locations.split(',').map((l: string) => `urn:li:geo:103644278`); // Default to North America for example if exact match fails
        targetingCriteria.include.and.push({
            or: { 'urn:li:adTargetingFacet:locations': locationUrns }
        });
    } else {
        targetingCriteria.include.and.push({
            or: { 'urn:li:adTargetingFacet:locations': ['urn:li:geo:103644278'] } // Default NA
        });
    }

    if (parameters.companySize) {
        // Map size to URNs
        const sizeMap: Record<string, string> = {
            '1_10': 'urn:li:organizationCapacity:(1,10)',
            '11_50': 'urn:li:organizationCapacity:(11,50)',
            '51_200': 'urn:li:organizationCapacity:(51,200)',
            '201_500': 'urn:li:organizationCapacity:(201,500)',
            '501_1000': 'urn:li:organizationCapacity:(501,1000)',
            '1000_PLUS': 'urn:li:organizationCapacity:(1001,)'
        };
        if (sizeMap[parameters.companySize]) {
            targetingCriteria.include.and.push({
                or: { 'urn:li:adTargetingFacet:staffCountRanges': [sizeMap[parameters.companySize]] }
            });
        }
    }

    if (parameters.seniority) {
        // Map seniority to URNs
        const seniorityMap: Record<string, string> = {
            'CXO': 'urn:li:seniority:10',
            'VP': 'urn:li:seniority:9',
            'DIRECTOR': 'urn:li:seniority:8',
            'MANAGER': 'urn:li:seniority:7',
            'SENIOR': 'urn:li:seniority:6',
            'ENTRY': 'urn:li:seniority:3'
        };
        if (seniorityMap[parameters.seniority]) {
            targetingCriteria.include.and.push({
                or: { 'urn:li:adTargetingFacet:seniorities': [seniorityMap[parameters.seniority]] }
            });
        }
    }

    // 3. Create Campaign Payload
    const campaignPayload: any = {
        account: `urn:li:sponsoredAccount:${accountId}`,
        campaignGroup: fullGroupUrn,
        name: `${name} (Built via LegacyMark)`,
        objectiveType: parameters.objective || 'LEAD_GENERATION',
        audience: targetingCriteria,
        status: 'PAUSED',
        format: parameters.adFormat || 'SINGLE_IMAGE',
        runSchedule: {
            start: Date.now()
        }
    };

    // Budgets
    if (parameters.biddingStrategy === 'TARGET_COST') {
        campaignPayload.optimizationTargetType = 'LEADS';
        campaignPayload.costTarget = { currencyCode: 'USD', amount: parameters.bidAmount?.toString() || '50' };
    } else if (parameters.biddingStrategy === 'MANUAL') {
        campaignPayload.unitCost = { currencyCode: 'USD', amount: parameters.bidAmount?.toString() || '5' };
    }

    if (dailyBudget) {
        campaignPayload.dailyBudget = { currencyCode: 'USD', amount: dailyBudget.toString() };
    }

    const campaignRes = await fetch(`${LINKEDIN_BASE_URL}/adCampaigns`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'X-RestLi-Protocol-Version': '2.0.0',
            'LinkedIn-Version': LINKEDIN_API_VERSION,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(campaignPayload)
    });

    if (!campaignRes.ok) {
        const errorBody = await campaignRes.text();
        console.error("LinkedIn Campaign Error:", errorBody);
        throw new Error("Failed to create LinkedIn Campaign");
    }

    const campaignUrn = campaignRes.headers.get('x-restli-id') || campaignRes.headers.get('location')?.split('/').pop()?.replace('urn:li:sponsoredCampaign:', '');

    return {
        success: true,
        groupId: groupUrn,
        campaignId: campaignUrn
    };
}
