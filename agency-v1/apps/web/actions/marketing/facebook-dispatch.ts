'use server';

import { db as prisma } from '@/lib/db';
import { auth } from '@/lib/auth';
import { getFacebookAdsConfig } from './facebook-ads';

const FB_GRAPH_URL = 'https://graph.facebook.com/v19.0';

/**
 * Creates a real Campaign, AdSet, and Ad in Meta Ads via Graph API
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

    // ROAS target: when bid strategy is TROAS, use LOWEST_COST_WITH_MIN_ROAS
    if (parameters.bidStrategy === 'TROAS' && parameters.roasTarget) {
        adSetPayload.bid_strategy = 'LOWEST_COST_WITH_MIN_ROAS';
        adSetPayload.roas_avg_floor = (parameters.roasTarget / 100).toString();
    }

    // Cost cap amount: set bid_amount in cents when strategy is COST_CAP
    if (parameters.bidStrategy === 'COST_CAP' && parameters.costCapAmount) {
        adSetPayload.bid_amount = (parameters.costCapAmount * 100).toString();
    }

    // Pacing type
    if (parameters.pacing) {
        adSetPayload.pacing_type = JSON.stringify(
            parameters.pacing === 'no_pacing' ? ['no_pacing'] : ['standard']
        );
    }

    // Day parting schedule
    if (parameters.dayParting?.schedule && Array.isArray(parameters.dayParting.schedule)) {
        const adsetSchedule = parameters.dayParting.schedule.map((slot: any) => ({
            start_minute: slot.start_minute ?? 0,
            end_minute: slot.end_minute ?? 1440,
            days: slot.days ?? [0, 1, 2, 3, 4, 5, 6],
            timezone_type: 'USER'
        }));
        adSetPayload.adset_schedule = JSON.stringify(adsetSchedule);
    }

    // Promoted object with pixel_id
    if (parameters.pixelId) {
        adSetPayload.promoted_object = JSON.stringify({ pixel_id: parameters.pixelId });
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

    // Interest targeting: pass interests[] to flexible_spec
    if (parameters.interests && Array.isArray(parameters.interests) && parameters.interests.length > 0) {
        targeting.flexible_spec = [
            {
                interests: parameters.interests.map((interest: any) => ({
                    id: interest.id,
                    name: interest.name
                }))
            }
        ];
    }

    // Advantage+ targeting automation
    if (parameters.advantagePlus) {
        targeting.targeting_automation = {
            advantage_audience: 1
        };
    }

    // Attach targeting
    adSetPayload.targeting = JSON.stringify(targeting);

    // Manual Placements (only when NOT Advantage+)
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

    const fbAdSetId = adSetResult.id;

    // 3. Create a real Ad within the Ad Set
    const ctaType = parameters.callToAction || 'LEARN_MORE';
    const destinationUrl = parameters.destinationUrl || 'https://example.com';
    const primaryText = parameters.primaryText || parameters.adCopy || name;
    const headline = parameters.headline || name;
    const description = parameters.description || '';
    const assetUrls: string[] = parameters.assetUrls || [];

    const linkData: any = {
        message: primaryText,
        link: destinationUrl,
        name: headline,
        description: description,
        call_to_action: {
            type: ctaType,
            value: { link: destinationUrl }
        }
    };

    // Use picture URL from assetUrls[0] since we don't have image_hash
    if (assetUrls.length > 0) {
        linkData.picture = assetUrls[0];
    }

    const adCreative = {
        object_story_spec: {
            page_id: parameters.pageId || '',
            link_data: linkData
        }
    };

    const adPayload = new URLSearchParams({
        name: `${name} - Ad`,
        adset_id: fbAdSetId,
        status: 'PAUSED',
        creative: JSON.stringify(adCreative),
        access_token: accessToken
    });

    const adRes = await fetch(`${FB_GRAPH_URL}/${adAccountId}/ads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: adPayload
    });

    const adResult = await adRes.json();
    if (adResult.error) {
        console.error("Meta Ad Creation Error:", adResult.error);
        // Don't throw — campaign + adset already created successfully
        return {
            success: true,
            campaignId: fbCampaignId,
            adSetId: fbAdSetId,
            adId: null,
            adError: adResult.error.message || "Failed to create Meta Ad"
        };
    }

    return {
        success: true,
        campaignId: fbCampaignId,
        adSetId: fbAdSetId,
        adId: adResult.id
    };
}
