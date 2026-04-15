'use server';

import { db as prisma } from '@/lib/db';
import { auth } from '@/lib/auth';
import { getTikTokAdsConfig } from './tiktok-ads';

const TIKTOK_API_URL = 'https://business-api.tiktok.com/open_api/v1.3';

/**
 * Creates a real Campaign and AdGroup in TikTok Ads API
 */
export async function createTikTokCampaign(campaignData: any) {
    const config = await getTikTokAdsConfig();
    if (!config || !config.isEnabled) {
        throw new Error("TikTok Ads is not configured or is disabled.");
    }

    const { advertiserId, accessToken } = config.config as any;
    const { parameters, name, dailyBudget, lifetimeBudget } = campaignData;

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
        headers: {
            'Access-Token': accessToken,
            'Content-Type': 'application/json'
        },
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

    const adGroupRes = await fetch(`${TIKTOK_API_URL}/adgroup/create/`, {
        method: 'POST',
        headers: {
            'Access-Token': accessToken,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(adGroupPayload)
    });

    const adGroupResult = await adGroupRes.json();
    if (adGroupResult.code !== 0) {
        console.error("TikTok Ad Group Creation Error:", adGroupResult.message);
        throw new Error(adGroupResult.message || "Failed to create TikTok Ad Group");
    }

    return {
        success: true,
        campaignId: tkCampaignId,
        adGroupId: adGroupResult.data.adgroup_id
    };
}
