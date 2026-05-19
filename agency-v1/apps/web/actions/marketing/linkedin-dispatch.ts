'use server';

import { db as prisma } from '@/lib/db';
import { auth } from '@/lib/auth';

const LINKEDIN_API_VERSION = '202306'; // Example version, check latest LinkedIn docs
const LINKEDIN_BASE_URL = 'https://api.linkedin.com/rest';

/**
 * Ad format mapping from wizard values to LinkedIn API format strings
 */
const AD_FORMAT_MAP: Record<string, string> = {
    SINGLE_IMAGE: 'SINGLE_IMAGE',
    VIDEO_AD: 'VIDEO_AD',
    VIDEO: 'VIDEO_AD',
    CAROUSEL: 'CAROUSEL',
    MESSAGE_AD: 'MESSAGE_AD',
    MESSAGE: 'MESSAGE_AD',
    CONVERSATION_AD: 'CONVERSATION_AD',
    CONVERSATION: 'CONVERSATION_AD',
};

/**
 * Creates a real Campaign Group, Campaign, and Creative in LinkedIn Ads API
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

    const defaultHeaders = {
        'Authorization': `Bearer ${accessToken}`,
        'X-RestLi-Protocol-Version': '2.0.0',
        'LinkedIn-Version': LINKEDIN_API_VERSION,
        'Content-Type': 'application/json'
    };

    // 1. Ensure a Campaign Group exists or create one
    // We'll create a default one for this campaign to keep it isolated initially
    const groupPayload = {
        account: `urn:li:sponsoredAccount:${accountId}`,
        name: `${name} - Group`,
        status: 'ACTIVE'
    };

    const groupRes = await fetch(`${LINKEDIN_BASE_URL}/adCampaignGroups`, {
        method: 'POST',
        headers: defaultHeaders,
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

    // Job Function targeting
    if (parameters.jobFunctions && Array.isArray(parameters.jobFunctions) && parameters.jobFunctions.length > 0) {
        const jobFunctionUrns = parameters.jobFunctions.map(
            (jf: any) => typeof jf === 'string' ? `urn:li:function:${jf}` : `urn:li:function:${jf.id}`
        );
        targetingCriteria.include.and.push({
            or: { 'urn:li:adTargetingFacet:jobFunctions': jobFunctionUrns }
        });
    }

    // Industry targeting
    if (parameters.industries && Array.isArray(parameters.industries) && parameters.industries.length > 0) {
        const industryUrns = parameters.industries.map(
            (ind: any) => typeof ind === 'string' ? `urn:li:industry:${ind}` : `urn:li:industry:${ind.id}`
        );
        targetingCriteria.include.and.push({
            or: { 'urn:li:adTargetingFacet:industries': industryUrns }
        });
    }

    // Skills targeting
    if (parameters.skills && Array.isArray(parameters.skills) && parameters.skills.length > 0) {
        const skillUrns = parameters.skills.map(
            (sk: any) => typeof sk === 'string' ? `urn:li:skill:${sk}` : `urn:li:skill:${sk.id}`
        );
        targetingCriteria.include.and.push({
            or: { 'urn:li:adTargetingFacet:skills': skillUrns }
        });
    }

    // 3. Create Campaign Payload
    // Resolve ad format
    const rawFormat = parameters.adFormat || 'SINGLE_IMAGE';
    const resolvedFormat = AD_FORMAT_MAP[rawFormat] || rawFormat;

    const campaignPayload: any = {
        account: `urn:li:sponsoredAccount:${accountId}`,
        campaignGroup: fullGroupUrn,
        name: `${name} (Built via LegacyMark)`,
        objectiveType: parameters.objective || 'LEAD_GENERATION',
        audience: targetingCriteria,
        status: 'PAUSED',
        format: resolvedFormat,
        runSchedule: {
            start: Date.now()
        }
    };

    // Day parting: extend runSchedule with start/end timestamps
    if (parameters.dayParting) {
        if (parameters.dayParting.startTimestamp) {
            campaignPayload.runSchedule.start = parameters.dayParting.startTimestamp;
        }
        if (parameters.dayParting.endTimestamp) {
            campaignPayload.runSchedule.end = parameters.dayParting.endTimestamp;
        }
    }

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

    // Lifetime budget via totalBudget field
    if (parameters.budgetType === 'LIFETIME' && lifetimeBudget) {
        campaignPayload.totalBudget = { currencyCode: 'USD', amount: lifetimeBudget.toString() };
    }

    const campaignRes = await fetch(`${LINKEDIN_BASE_URL}/adCampaigns`, {
        method: 'POST',
        headers: defaultHeaders,
        body: JSON.stringify(campaignPayload)
    });

    if (!campaignRes.ok) {
        const errorBody = await campaignRes.text();
        console.error("LinkedIn Campaign Error:", errorBody);
        throw new Error("Failed to create LinkedIn Campaign");
    }

    const campaignUrn = campaignRes.headers.get('x-restli-id') || campaignRes.headers.get('location')?.split('/').pop()?.replace('urn:li:sponsoredCampaign:', '');

    if (!campaignUrn) {
        throw new Error("Failed to parse Campaign URN from LinkedIn response");
    }

    const fullCampaignUrn = `urn:li:sponsoredCampaign:${campaignUrn}`;

    // 4. Create a real Ad Creative
    const primaryText = parameters.primaryText || parameters.adCopy || name;
    const headline = parameters.headline || name;
    const assetUrls: string[] = parameters.assetUrls || [];
    const destinationUrl = parameters.destinationUrl || 'https://example.com';

    const creativeVariables: any = {
        data: {
            'com.linkedin.ads.SponsoredUpdateCreativeVariables': {
                activity: '',
                directSponsoredContent: true,
                share: {
                    shareCommentary: {
                        text: primaryText
                    },
                    shareMediaCategory: 'NONE'
                }
            }
        }
    };

    // Attach image if available
    if (assetUrls.length > 0) {
        const shareMedia = {
            shareMediaCategory: 'IMAGE',
            media: assetUrls.map((url: string) => ({
                status: 'READY',
                originalUrl: url,
                title: {
                    text: headline
                },
                description: {
                    text: parameters.description || ''
                }
            }))
        };
        creativeVariables.data['com.linkedin.ads.SponsoredUpdateCreativeVariables'].share = {
            ...creativeVariables.data['com.linkedin.ads.SponsoredUpdateCreativeVariables'].share,
            ...shareMedia
        };
    }

    const creativePayload = {
        campaign: fullCampaignUrn,
        reference: `urn:li:sponsoredAccount:${accountId}`,
        status: 'PAUSED',
        variables: creativeVariables
    };

    const creativeRes = await fetch(`${LINKEDIN_BASE_URL}/adCreatives`, {
        method: 'POST',
        headers: defaultHeaders,
        body: JSON.stringify(creativePayload)
    });

    let creativeId: string | null = null;

    if (!creativeRes.ok) {
        const creativeError = await creativeRes.text();
        console.error("LinkedIn Creative Error:", creativeError);
        // Non-fatal: campaign already created
        return {
            success: true,
            groupId: groupUrn,
            campaignId: campaignUrn,
            creativeId: null,
            creativeError: "Failed to create LinkedIn Creative"
        };
    } else {
        creativeId = creativeRes.headers.get('x-restli-id') || null;
    }

    return {
        success: true,
        groupId: groupUrn,
        campaignId: campaignUrn,
        creativeId
    };
}
