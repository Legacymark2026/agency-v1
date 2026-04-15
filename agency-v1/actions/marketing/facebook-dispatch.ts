'use server';

import { db as prisma } from '@/lib/db';
import { auth } from '@/lib/auth';
import { getFacebookAdsConfig } from './facebook-ads';

const FB_GRAPH_URL = 'https://graph.facebook.com/v19.0';

/**
 * Creates a real Campaign and AdSet in Meta Ads via Graph API
 */
export async function createFacebookAdSet(campaignData: any) {
    const config = await getFacebookAdsConfig();
    if (!config || !config.isEnabled) {
        throw new Error("Facebook Ads is not configured or is disabled.");
    }

    const { adAccountId, accessToken } = config.config as any;
    const { parameters, name, dailyBudget, lifetimeBudget } = campaignData;

    // 1. Create Campaign
    const campaignPayload = new URLSearchParams({
        name: `${name} (Created via LegacyMark Builder)`,
        objective: parameters.objective || 'OUTCOME_LEADS',
        status: 'PAUSED', // Always create paused initially for safety
        special_ad_categories: '[]',
        access_token: accessToken
    });

    const campaignRes = await fetch(`${FB_GRAPH_URL}/${adAccountId}/campaigns`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: campaignPayload
    });

    const campaignResult = await campaignRes.json();
    if (campaignResult.error) {
        console.error("Meta Campaign Creation Error:", campaignResult.error);
        throw new Error(campaignResult.error.message || "Failed to create Meta Campaign");
    }

    const fbCampaignId = campaignResult.id;

    // 2. Build Ad Set Payload based on advanced parameters
    // Convert budgets to cents as Graph API expects
    const adSetPayload: any = {
        name: `${name} - Ad Set`,
        campaign_id: fbCampaignId,
        status: 'PAUSED',
        billing_event: 'IMPRESSIONS',
        optimization_goal: parameters.bidStrategy === 'COST_CAP' ? 'LEAD_GENERATION' : 'REACH', // Simplified mapping based on objective
        bid_strategy: parameters.bidStrategy || 'LOWEST_COST_WITHOUT_CAP',
        access_token: accessToken
    };

    if (parameters.budgetType === 'LIFETIME' && lifetimeBudget) {
        adSetPayload.lifetime_budget = (lifetimeBudget * 100).toString();
        // Lifetime budgets require an end time
        const end = new Date();
        end.setDate(end.getDate() + 30);
        adSetPayload.end_time = end.toISOString();
    } else {
        adSetPayload.daily_budget = (dailyBudget * 100 || 5000).toString(); // default $50/day
    }

    if (parameters.bidStrategy === 'COST_CAP' && parameters.bidAmount) {
        adSetPayload.bid_amount = (parameters.bidAmount * 100).toString();
    }

    // Advanced Targeting payload
    // FIX #5: locations can be either a LocationTarget[] (from wizard store) or a CSV string (legacy).
    // Normalize to an array of country codes/names before sending to Meta.
    function normalizeLocations(raw: any): string[] {
        if (!raw) return ['CO']; // default Colombia

        // Array of LocationTarget objects: { id, name, type, ... }
        if (Array.isArray(raw)) {
            return raw.map((loc: any) => {
                // Meta expects 2-letter country codes for countries
                // Use name as fallback; ideally map to ISO codes
                const COUNTRY_MAP: Record<string, string> = {
                    colombia: 'CO', 'estados unidos': 'US', 'united states': 'US',
                    mexico: 'MX', 'españa': 'ES', spain: 'ES', argentina: 'AR',
                    chile: 'CL', peru: 'PE', venezuela: 'VE', ecuador: 'EC',
                    brasil: 'BR', brazil: 'BR', bolivia: 'BO', paraguay: 'PY',
                    uruguay: 'UY', panama: 'PA', 'costa rica': 'CR', guatemala: 'GT',
                };
                const nameLower = (loc?.name || '').toLowerCase();
                return COUNTRY_MAP[nameLower] || loc?.id?.toUpperCase() || loc?.name || 'CO';
            }).filter(Boolean);
        }

        // CSV string (legacy format): "CO,US,MX"
        if (typeof raw === 'string') {
            return raw.split(',').map((l: string) => l.trim()).filter(Boolean);
        }

        return ['CO'];
    }

    const targeting: any = {
        geo_locations: {
            countries: normalizeLocations(parameters.locations)
        }
    };


    if (parameters.minAge || parameters.maxAge) {
        if (parameters.minAge) targeting.age_min = parseInt(parameters.minAge);
        if (parameters.maxAge) targeting.age_max = parseInt(parameters.maxAge);
    }

    if (parameters.customAudiences) {
        targeting.custom_audiences = parameters.customAudiences.split(',').map((id: string) => ({ id: id.trim() }));
    }

    if (parameters.excludedAudiences) {
        targeting.excluded_custom_audiences = parameters.excludedAudiences.split(',').map((id: string) => ({ id: id.trim() }));
    }

    // Attach targeting
    adSetPayload.targeting = JSON.stringify(targeting);

    // Advantage+ / Manual Placements
    if (!parameters.advantagePlus && parameters.manualPlacements) {
        const targetingObj = JSON.parse(adSetPayload.targeting);
        if (parameters.manualPlacements === 'FB_IG') {
            targetingObj.publisher_platforms = ['facebook', 'instagram'];
            targetingObj.facebook_positions = ['feed', 'video_feeds'];
            targetingObj.instagram_positions = ['stream', 'reels'];
        } else if (parameters.manualPlacements === 'IG_ONLY') {
            targetingObj.publisher_platforms = ['instagram'];
        }
        adSetPayload.targeting = JSON.stringify(targetingObj);
    }

    const adSetParams = new URLSearchParams(adSetPayload);

    const adSetRes = await fetch(`${FB_GRAPH_URL}/${adAccountId}/adsets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: adSetParams
    });

    const adSetResult = await adSetRes.json();
    if (adSetResult.error) {
        console.error("Meta Ad Set Creation Error:", adSetResult.error);
        throw new Error(adSetResult.error.message || "Failed to create Meta Ad Set");
    }

    return {
        success: true,
        campaignId: fbCampaignId,
        adSetId: adSetResult.id
    };
}
