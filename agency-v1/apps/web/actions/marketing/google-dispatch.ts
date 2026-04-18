'use server';

import { db as prisma } from '@/lib/db';
import { auth } from '@/lib/auth';

/**
 * Creates a real Campaign and AdGroup in Google Ads via REST API
 */
export async function createGoogleCampaign(campaignData: any) {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");

    // Get company ID
    const companyUser = await prisma.companyUser.findFirst({
        where: { userId: session.user.id },
        select: { companyId: true }
    });

    if (!companyUser) throw new Error("Company not found");

    const configRecord = await prisma.integrationConfig.findUnique({
        where: {
            companyId_provider: {
                companyId: companyUser.companyId,
                provider: 'google_ads'
            }
        }
    });

    if (!configRecord || !configRecord.isEnabled) {
        throw new Error("Google Ads is not configured or is disabled.");
    }

    const { customerId, accessToken, developerToken } = configRecord.config as any;
    const { parameters, name, dailyBudget } = campaignData;

    // Note: Google Ads API uses REST endpoint with customerId in the path
    const GOOGLE_ADS_API_URL = `https://googleads.googleapis.com/v15/customers/${customerId}`;

    // 1. Create Campaign Budget
    const budgetPayload = {
        operations: [
            {
                create: {
                    name: `${name} - Budget - ${Date.now()}`,
                    amountMicros: (dailyBudget * 1000000 || 50000000).toString(), // Default $50/day
                    deliveryMethod: 'STANDARD'
                }
            }
        ]
    };

    const budgetRes = await fetch(`${GOOGLE_ADS_API_URL}/campaignBudgets:mutate`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'developer-token': developerToken,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(budgetPayload)
    });

    const budgetResult = await budgetRes.json();
    if (budgetResult.error) {
        console.error("Google Budget Creation Error:", budgetResult.error);
        throw new Error(budgetResult.error.message || "Failed to create Google Campaign Budget");
    }

    const budgetResourceName = budgetResult.results[0].resourceName;

    // 2. Map strategies
    let biddingStrategyConfig: any = {};
    if (parameters.strategy === 'MAXIMIZE_CONVERSIONS') biddingStrategyConfig.maximizeConversions = {};
    if (parameters.strategy === 'TARGET_CPA') biddingStrategyConfig.targetCpa = { targetCpaMicros: (parameters.targetValue * 1000000).toString() };
    if (parameters.strategy === 'TARGET_ROAS') biddingStrategyConfig.targetRoas = { targetRoas: parameters.targetValue / 100 };
    if (parameters.strategy === 'MANUAL_CPC') biddingStrategyConfig.manualCpc = {};

    let advertisingChannelType = 'SEARCH';
    if (parameters.campaignType === 'DISPLAY') advertisingChannelType = 'DISPLAY';
    if (parameters.campaignType === 'VIDEO') advertisingChannelType = 'VIDEO';
    if (parameters.campaignType === 'PERFORMANCE_MAX') advertisingChannelType = 'PERFORMANCE_MAX';

    // 3. Create Campaign
    const campaignPayload = {
        operations: [
            {
                create: {
                    name: `${name} (Built via LegacyMark)`,
                    status: 'PAUSED',
                    advertisingChannelType,
                    campaignBudget: budgetResourceName,
                    networkSettings: {
                        targetGoogleSearch: true,
                        targetSearchNetwork: parameters.searchPartners ?? true,
                        targetContentNetwork: parameters.displayNetwork ?? false,
                    },
                    ...biddingStrategyConfig
                }
            }
        ]
    };

    const campaignRes = await fetch(`${GOOGLE_ADS_API_URL}/campaigns:mutate`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'developer-token': developerToken,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(campaignPayload)
    });

    const campaignResult = await campaignRes.json();
    if (campaignResult.error) {
        console.error("Google Campaign Creation Error:", campaignResult.error);
        throw new Error(campaignResult.error.message || "Failed to create Google Campaign");
    }

    const campaignResourceName = campaignResult.results[0].resourceName;

    // 4. Create Ad Group (if not Performance Max)
    if (advertisingChannelType !== 'PERFORMANCE_MAX') {
        const adGroupPayload = {
            operations: [
                {
                    create: {
                        name: `${name} - Ad Group`,
                        campaign: campaignResourceName,
                        status: 'ENABLED',
                        type: advertisingChannelType === 'SEARCH' ? 'SEARCH_STANDARD' : 'DISPLAY_STANDARD'
                    }
                }
            ]
        };

        if (parameters.strategy === 'MANUAL_CPC' && parameters.targetValue) {
            (adGroupPayload.operations[0].create as any).cpcBidMicros = (parameters.targetValue * 1000000).toString();
        }

        const adGroupRes = await fetch(`${GOOGLE_ADS_API_URL}/adGroups:mutate`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'developer-token': developerToken,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(adGroupPayload)
        });

        const adGroupResult = await adGroupRes.json();

        if (adGroupResult.error) {
            console.error("Google Ad Group Creation Error:", adGroupResult.error);
            throw new Error(adGroupResult.error.message || "Failed to create Google Ad Group");
        }

        return {
            success: true,
            campaignId: campaignResourceName,
            adGroupId: adGroupResult.results[0].resourceName
        };
    }

    return {
        success: true,
        campaignId: campaignResourceName
    };
}
