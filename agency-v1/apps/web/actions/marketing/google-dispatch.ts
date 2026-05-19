'use server';

import { db as prisma } from '@/lib/db';
import { auth } from '@/lib/auth';

/**
 * Creates a real Campaign, AdGroup, RSA Ad, geo targeting, and demographic
 * criteria in Google Ads via REST API.
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

    const GOOGLE_ADS_API_URL = `https://googleads.googleapis.com/v15/customers/${customerId}`;

    const defaultHeaders = {
        'Authorization': `Bearer ${accessToken}`,
        'developer-token': developerToken,
        'Content-Type': 'application/json'
    };

    // 1. Create Campaign Budget
    // Map pacing → deliveryMethod
    const deliveryMethod = parameters.pacing === 'ACCELERATED' ? 'ACCELERATED' : 'STANDARD';

    const budgetPayload = {
        operations: [
            {
                create: {
                    name: `${name} - Budget - ${Date.now()}`,
                    amountMicros: (dailyBudget * 1000000 || 50000000).toString(), // Default $50/day
                    deliveryMethod
                }
            }
        ]
    };

    const budgetRes = await fetch(`${GOOGLE_ADS_API_URL}/campaignBudgets:mutate`, {
        method: 'POST',
        headers: defaultHeaders,
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
        headers: defaultHeaders,
        body: JSON.stringify(campaignPayload)
    });

    const campaignResult = await campaignRes.json();
    if (campaignResult.error) {
        console.error("Google Campaign Creation Error:", campaignResult.error);
        throw new Error(campaignResult.error.message || "Failed to create Google Campaign");
    }

    const campaignResourceName = campaignResult.results[0].resourceName;

    // 4. Geo targeting: create campaign criteria for location targets
    if (parameters.geoTargets && Array.isArray(parameters.geoTargets) && parameters.geoTargets.length > 0) {
        const locationOps = parameters.geoTargets.map((geoId: string) => ({
            create: {
                campaign: campaignResourceName,
                location: {
                    geoTargetConstant: `geoTargetConstants/${geoId}`
                },
                negative: false
            }
        }));

        const geoCriteriaPayload = { operations: locationOps };

        const geoRes = await fetch(`${GOOGLE_ADS_API_URL}/campaignCriteria:mutate`, {
            method: 'POST',
            headers: defaultHeaders,
            body: JSON.stringify(geoCriteriaPayload)
        });

        const geoResult = await geoRes.json();
        if (geoResult.error) {
            console.error("Google Geo Targeting Error:", geoResult.error);
            // Non-fatal: campaign already created, log and continue
        }
    }

    // 5. Day parting: create adSchedule campaign criteria
    if (parameters.dayParting && Array.isArray(parameters.dayParting) && parameters.dayParting.length > 0) {
        const scheduleOps = parameters.dayParting.map((slot: any) => ({
            create: {
                campaign: campaignResourceName,
                adSchedule: {
                    dayOfWeek: slot.dayOfWeek || 'MONDAY',       // e.g. 'MONDAY'
                    startHour: slot.startHour ?? 0,
                    startMinute: slot.startMinute || 'ZERO',     // ZERO, FIFTEEN, THIRTY, FORTY_FIVE
                    endHour: slot.endHour ?? 24,
                    endMinute: slot.endMinute || 'ZERO'
                }
            }
        }));

        const scheduleCriteriaPayload = { operations: scheduleOps };

        const scheduleRes = await fetch(`${GOOGLE_ADS_API_URL}/campaignCriteria:mutate`, {
            method: 'POST',
            headers: defaultHeaders,
            body: JSON.stringify(scheduleCriteriaPayload)
        });

        const scheduleResult = await scheduleRes.json();
        if (scheduleResult.error) {
            console.error("Google Day Parting Error:", scheduleResult.error);
        }
    }

    // 6. Create Ad Group (if not Performance Max)
    let adGroupResourceName: string | null = null;

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
            headers: defaultHeaders,
            body: JSON.stringify(adGroupPayload)
        });

        const adGroupResult = await adGroupRes.json();

        if (adGroupResult.error) {
            console.error("Google Ad Group Creation Error:", adGroupResult.error);
            throw new Error(adGroupResult.error.message || "Failed to create Google Ad Group");
        }

        adGroupResourceName = adGroupResult.results[0].resourceName;

        // 7. Age and gender targeting via ad group criteria
        const demographicOps: any[] = [];

        if (parameters.ageRange && Array.isArray(parameters.ageRange)) {
            parameters.ageRange.forEach((ageType: string) => {
                demographicOps.push({
                    create: {
                        adGroup: adGroupResourceName,
                        ageRange: { type: ageType } // e.g. AGE_RANGE_18_24, AGE_RANGE_25_34
                    }
                });
            });
        }

        if (parameters.gender && parameters.gender !== 'ALL') {
            demographicOps.push({
                create: {
                    adGroup: adGroupResourceName,
                    gender: { type: parameters.gender } // MALE, FEMALE, UNDETERMINED
                }
            });
        }

        if (demographicOps.length > 0) {
            const demoRes = await fetch(`${GOOGLE_ADS_API_URL}/adGroupCriteria:mutate`, {
                method: 'POST',
                headers: defaultHeaders,
                body: JSON.stringify({ operations: demographicOps })
            });

            const demoResult = await demoRes.json();
            if (demoResult.error) {
                console.error("Google Demographic Targeting Error:", demoResult.error);
            }
        }

        // 8. Create Responsive Search Ad (RSA)
        const destinationUrl = parameters.destinationUrl || 'https://example.com';

        // Build headlines: minimum 3, pad with defaults if fewer provided
        const rawHeadlines: string[] = parameters.headlines && Array.isArray(parameters.headlines)
            ? parameters.headlines : [];
        const defaultHeadlines = ['Learn More Today', 'Get Started Now', 'Discover More'];
        while (rawHeadlines.length < 3) {
            rawHeadlines.push(defaultHeadlines[rawHeadlines.length] || `Headline ${rawHeadlines.length + 1}`);
        }
        const headlines = rawHeadlines.map((text: string) => ({ text }));

        // Build descriptions: minimum 2
        const rawDescriptions: string[] = parameters.descriptions && Array.isArray(parameters.descriptions)
            ? parameters.descriptions : [];
        const defaultDescriptions = ['Click here to learn more.', 'Sign up today!'];
        while (rawDescriptions.length < 2) {
            rawDescriptions.push(defaultDescriptions[rawDescriptions.length] || `Description ${rawDescriptions.length + 1}`);
        }
        const descriptions = rawDescriptions.map((text: string) => ({ text }));

        // Extract path parts from destinationUrl
        let path1 = '';
        let path2 = '';
        try {
            const urlParts = new URL(destinationUrl).pathname.split('/').filter(Boolean);
            if (urlParts.length >= 1) path1 = urlParts[0].substring(0, 15); // Max 15 chars
            if (urlParts.length >= 2) path2 = urlParts[1].substring(0, 15);
        } catch (_) { /* invalid URL, skip path */ }

        const rsaPayload = {
            operations: [
                {
                    create: {
                        adGroup: adGroupResourceName,
                        status: 'PAUSED',
                        ad: {
                            responsiveSearchAd: {
                                headlines,
                                descriptions,
                                path1: path1 || undefined,
                                path2: path2 || undefined
                            },
                            finalUrls: [destinationUrl]
                        }
                    }
                }
            ]
        };

        const rsaRes = await fetch(`${GOOGLE_ADS_API_URL}/adGroupAds:mutate`, {
            method: 'POST',
            headers: defaultHeaders,
            body: JSON.stringify(rsaPayload)
        });

        const rsaResult = await rsaRes.json();
        if (rsaResult.error) {
            console.error("Google RSA Creation Error:", rsaResult.error);
            // Non-fatal: ad group already created
            return {
                success: true,
                campaignId: campaignResourceName,
                adGroupId: adGroupResourceName,
                adId: null,
                adError: rsaResult.error.message || "Failed to create RSA"
            };
        }

        return {
            success: true,
            campaignId: campaignResourceName,
            adGroupId: adGroupResourceName,
            adId: rsaResult.results[0].resourceName
        };
    }

    return {
        success: true,
        campaignId: campaignResourceName
    };
}
