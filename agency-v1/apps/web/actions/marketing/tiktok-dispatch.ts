'use server';

import { db as prisma } from '@/lib/db';
import { auth } from '@/lib/auth';
import { getTikTokAdsConfig } from './tiktok-ads';

const TIKTOK_API_URL = 'https://business-api.tiktok.com/open_api/v1.3';

/**
 * Basic mapping of common interest names to TikTok interest category IDs.
 * In production this would come from the TikTok Interest Keyword API.
 */
const TIKTOK_INTEREST_MAP: Record<string, string> = {
    'technology': '15001',
    'fashion': '15002',
    'beauty': '15003',
    'fitness': '15004',
    'gaming': '15005',
    'food': '15006',
    'travel': '15007',
    'music': '15008',
    'sports': '15009',
    'business': '15010',
    'education': '15011',
    'entertainment': '15012',
    'health': '15013',
    'finance': '15014',
    'automotive': '15015',
};

/**
 * Creates a real Campaign, AdGroup, and Ad in TikTok Ads API
 */
export async function createTikTokCampaign(campaignData: any) {
    const config = await getTikTokAdsConfig();
    if (!config || !config.isEnabled) {
        throw new Error("TikTok Ads is not configured or is disabled.");
    }

    const { advertiserId, accessToken } = config.config as any;
    const { parameters, name, dailyBudget, lifetimeBudget } = campaignData;

    const defaultHeaders = {
        'Access-Token': accessToken,
        'Content-Type': 'application/json'
    };

    // 1. Create Campaign Payload
    const campaignPayload = {
        advertiser_id: advertiserId,
        campaign_name: `${name} (Created via LegacyMark)`,
        objective_type: parameters.objective || 'LEAD_GENERATION',
        budget_mode: lifetimeBudget ? 'BUDGET_MODE_TOTAL' : 'BUDGET_MODE_DAY',
        budget: lifetimeBudget || dailyBudget || 50, // Minimum usually $50
    };

    const campaignRes = await fetch(`${TIKTOK_API_URL}/campaign/create/`, {
        method: 'POST',
        headers: defaultHeaders,
        body: JSON.stringify(campaignPayload)
    });

    const campaignResult = await campaignRes.json();
    if (campaignResult.code !== 0) {
        console.error("TikTok Campaign Creation Error:", campaignResult.message);
        throw new Error(campaignResult.message || "Failed to create TikTok Campaign");
    }

    const tkCampaignId = campaignResult.data.campaign_id;

    // 2. Create Ad Group Payload
    const adGroupPayload: any = {
        advertiser_id: advertiserId,
        campaign_id: tkCampaignId,
        adgroup_name: `${name} - Ad Group`,
        placement_type: parameters.placements === 'AUTOMATIC' ? 'PLACEMENT_TYPE_AUTOMATIC' : 'PLACEMENT_TYPE_NORMAL',
        optimization_goal: parameters.optimizationGoal || 'CONVERSION',
        billing_event: 'OCPM',
        bid_type: 'BID_TYPE_NO_BID', // Lowest cost
        budget_mode: 'BUDGET_MODE_DAY',
        budget: dailyBudget || 50,
        schedule_type: 'SCHEDULE_START_END',
        schedule_start_time: new Date().toISOString(),
    };

    if (parameters.placements !== 'AUTOMATIC') {
        const placementsList = [];
        if (parameters.placements === 'TIKTOK_ONLY') placementsList.push('PLACEMENT_TIKTOK');
        if (parameters.placements === 'PANGLE') placementsList.push('PLACEMENT_PANGLE');
        adGroupPayload.placements = placementsList;
    }

    // Demographics map
    if (parameters.location_ids) {
        adGroupPayload.location_ids = parameters.location_ids.split(',').map((id: string) => id.trim());
    }
    if (parameters.languages) {
        adGroupPayload.languages = parameters.languages.split(',').map((id: string) => id.trim());
    }
    if (parameters.gender && parameters.gender !== 'ALL') {
        adGroupPayload.gender = parameters.gender === 'MALE' ? 'GENDER_MALE' : 'GENDER_FEMALE';
    }
    if (parameters.ageGroups && parameters.ageGroups !== 'ALL') {
        // simplified mapping, usually TikTok expects string enums like AGE_18_24
        adGroupPayload.age = [`AGE_${parameters.ageGroups}`];
    }
    if (parameters.os && parameters.os !== 'ALL') {
        adGroupPayload.operating_system = [parameters.os === 'IOS' ? 'IOS' : 'ANDROID'];
    }

    // Interest targeting: map interest names to TikTok category IDs
    if (parameters.interests && Array.isArray(parameters.interests) && parameters.interests.length > 0) {
        const interestIds = parameters.interests
            .map((interest: any) => {
                const interestName = (typeof interest === 'string' ? interest : interest.name || '').toLowerCase();
                return TIKTOK_INTEREST_MAP[interestName] || interest.id || null;
            })
            .filter(Boolean);

        if (interestIds.length > 0) {
            adGroupPayload.interest_category_ids = interestIds;
        }
    }

    // Pacing mode
    if (parameters.pacing) {
        adGroupPayload.pacing = parameters.pacing === 'FAST'
            ? 'PACING_MODE_FAST'
            : 'PACING_MODE_SMOOTH';
    }

    // Cost cap amount → bid_price with custom bid type
    if (parameters.costCapAmount) {
        adGroupPayload.bid_type = 'BID_TYPE_CUSTOM';
        adGroupPayload.bid_price = parameters.costCapAmount;
    }

    // Day parting schedule
    if (parameters.dayParting && parameters.dayParting.schedule) {
        // TikTok dayparting uses a 336-character string (48 half-hour slots × 7 days)
        // or a structured object depending on API version.
        // We support both structured schedule and the raw string.
        if (typeof parameters.dayParting.schedule === 'string') {
            adGroupPayload.dayparting = parameters.dayParting.schedule;
        } else if (Array.isArray(parameters.dayParting.schedule)) {
            // Convert structured schedule to TikTok format
            // Build a 48×7 grid (each char '0' or '1'), 48 half-hours per day, 7 days
            const grid = Array(7).fill(null).map(() => Array(48).fill('0'));
            for (const slot of parameters.dayParting.schedule) {
                const days: number[] = slot.days || [0, 1, 2, 3, 4, 5, 6];
                const startSlot = Math.floor((slot.start_minute ?? 0) / 30);
                const endSlot = Math.ceil((slot.end_minute ?? 1440) / 30);
                for (const day of days) {
                    if (day >= 0 && day < 7) {
                        for (let s = startSlot; s < endSlot && s < 48; s++) {
                            grid[day][s] = '1';
                        }
                    }
                }
            }
            adGroupPayload.dayparting = grid.map(row => row.join('')).join('');
        }
    }

    const adGroupRes = await fetch(`${TIKTOK_API_URL}/adgroup/create/`, {
        method: 'POST',
        headers: defaultHeaders,
        body: JSON.stringify(adGroupPayload)
    });

    const adGroupResult = await adGroupRes.json();
    if (adGroupResult.code !== 0) {
        console.error("TikTok Ad Group Creation Error:", adGroupResult.message);
        throw new Error(adGroupResult.message || "Failed to create TikTok Ad Group");
    }

    const tkAdGroupId = adGroupResult.data.adgroup_id;

    // 3. Create a real Ad within the Ad Group
    const primaryText = parameters.primaryText || parameters.adCopy || name;
    const ctaType = parameters.callToAction || 'LEARN_MORE';
    const destinationUrl = parameters.destinationUrl || 'https://example.com';
    const assetUrls: string[] = parameters.assetUrls || [];

    const adPayload: any = {
        advertiser_id: advertiserId,
        adgroup_id: tkAdGroupId,
        ad_name: `${name} - Ad`,
        ad_text: primaryText,
        call_to_action: ctaType,
        landing_page_url: destinationUrl,
        image_mode: 'SINGLE_IMAGE',
    };

    // Attach image assets if available
    if (assetUrls.length > 0) {
        adPayload.image_list = assetUrls.map((url: string) => ({ image_url: url }));
    }

    // Optionally use video if provided
    if (parameters.videoId) {
        adPayload.video_id = parameters.videoId;
        delete adPayload.image_mode;
        delete adPayload.image_list;
    }

    const adRes = await fetch(`${TIKTOK_API_URL}/ad/create/`, {
        method: 'POST',
        headers: defaultHeaders,
        body: JSON.stringify(adPayload)
    });

    const adResult = await adRes.json();
    if (adResult.code !== 0) {
        console.error("TikTok Ad Creation Error:", adResult.message);
        // Non-fatal: campaign + ad group already created
        return {
            success: true,
            campaignId: tkCampaignId,
            adGroupId: tkAdGroupId,
            adId: null,
            adError: adResult.message || "Failed to create TikTok Ad"
        };
    }

    return {
        success: true,
        campaignId: tkCampaignId,
        adGroupId: tkAdGroupId,
        adId: adResult.data.ad_id
    };
}
