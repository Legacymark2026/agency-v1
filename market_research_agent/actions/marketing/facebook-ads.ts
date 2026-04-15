'use server';

import { db as prisma } from '@/lib/db';
import { auth } from '@/lib/auth';

const FB_GRAPH_URL = 'https://graph.facebook.com/v19.0';

/**
 * Gets the stored Facebook Ads configuration for the current company.
 */
export async function getFacebookAdsConfig() {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");

    // Get company ID
    const companyUser = await prisma.companyUser.findFirst({
        where: { userId: session.user.id },
        select: { companyId: true }
    });

    if (!companyUser) throw new Error("Company not found");

    const config = await prisma.integrationConfig.findUnique({
        where: {
            companyId_provider: {
                companyId: companyUser.companyId,
                provider: 'facebook_ads'
            }
        }
    });

    return config;
}

/**
 * Saves or updates the Facebook Ads credentials.
 */
export async function connectFacebookAds(adAccountId: string, accessToken: string) {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");

    const companyUser = await prisma.companyUser.findFirst({
        where: { userId: session.user.id },
        select: { companyId: true }
    });

    if (!companyUser) throw new Error("Company not found");

    // Clean up adAccountId (ensure it has 'act_' prefix if required by Meta, 
    // or remove it if user input it and we want consistent formatting. 
    // Usually Meta endpoints expect act_12345).
    const formattedAccountId = adAccountId.startsWith('act_') ? adAccountId : `act_${adAccountId}`;

    const configRecord = await prisma.integrationConfig.upsert({
        where: {
            companyId_provider: {
                companyId: companyUser.companyId,
                provider: 'facebook_ads'
            }
        },
        update: {
            config: { adAccountId: formattedAccountId, accessToken },
            isEnabled: true
        },
        create: {
            companyId: companyUser.companyId,
            provider: 'facebook_ads',
            config: { adAccountId: formattedAccountId, accessToken },
            isEnabled: true
        }
    });

    return { success: true, configId: configRecord.id };
}

/**
 * Fetches Real Campaigns from Meta Ads API
 */
export async function getFacebookCampaigns() {
    const config = await getFacebookAdsConfig();
    if (!config || !config.isEnabled) {
        throw new Error("Facebook Ads is not configured or is disabled.");
    }

    const { adAccountId, accessToken } = config.config as any;

    try {
        const response = await fetch(
            `${FB_GRAPH_URL}/${adAccountId}/campaigns?fields=id,name,status,objective,daily_budget,lifetime_budget&access_token=${accessToken}`
        );

        const data = await response.json();

        if (data.error) {
            console.error("Meta API Error:", data.error);
            throw new Error(data.error.message || "Failed to fetch Facebook campaigns");
        }

        return data.data || [];
    } catch (error) {
        console.error("Failed to get FB campaigns:", error);
        throw error;
    }
}

/**
 * Fetches campaign insights (spend, impressions, clicks) from Meta Ads API
 */
export async function getFacebookInsights(datePreset: string = 'last_30d') {
    const config = await getFacebookAdsConfig();
    if (!config || !config.isEnabled) {
        throw new Error("Facebook Ads is not configured or is disabled.");
    }

    const { adAccountId, accessToken } = config.config as any;

    try {
        // Fetch aggregated insights for the account
        const response = await fetch(
            `${FB_GRAPH_URL}/${adAccountId}/insights?fields=campaign_id,campaign_name,spend,impressions,clicks,actions&date_preset=${datePreset}&access_token=${accessToken}`
        );

        const data = await response.json();

        if (data.error) {
            console.error("Meta API Error:", data.error);
            throw new Error(data.error.message || "Failed to fetch Facebook insights");
        }

        return data.data || [];
    } catch (error) {
        console.error("Failed to get FB insights:", error);
        throw error;
    }
}
