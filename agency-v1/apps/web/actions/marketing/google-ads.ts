'use server';

import { db as prisma } from '@/lib/db';
import { auth } from '@/lib/auth';

const GOOGLE_ADS_REST_URL = 'https://googleads.googleapis.com/v16'; // Adjust version as needed
const GOOGLE_OAUTH_TOKEN_URL = 'https://oauth2.googleapis.com/token';

/**
 * Gets the stored Google Ads configuration for the current company.
 */
export async function getGoogleAdsConfig() {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");

    const companyUser = await prisma.companyUser.findFirst({
        where: { userId: session.user.id },
        select: { companyId: true }
    });

    if (!companyUser) throw new Error("Company not found");

    const config = await prisma.integrationConfig.findUnique({
        where: {
            companyId_provider: {
                companyId: companyUser.companyId,
                provider: 'google_ads'
            }
        }
    });

    return config;
}

/**
 * Obtains a fresh access token using the stored refresh token.
 */
async function getFreshAccessToken(clientId: string, clientSecret: string, refreshToken: string) {
    const response = await fetch(GOOGLE_OAUTH_TOKEN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            client_id: clientId,
            client_secret: clientSecret,
            refresh_token: refreshToken,
            grant_type: 'refresh_token'
        })
    });

    const data = await response.json();
    if (data.error) throw new Error(data.error_description || "Failed to refresh Google token");

    return data.access_token;
}

/**
 * Saves or updates the Google Ads credentials.
 */
export async function connectGoogleAds(
    customerId: string,
    developerToken: string,
    clientId: string,
    clientSecret: string,
    refreshToken: string
) {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");

    const companyUser = await prisma.companyUser.findFirst({
        where: { userId: session.user.id },
        select: { companyId: true }
    });

    if (!companyUser) throw new Error("Company not found");

    // Ensure customerId is without dashes
    const formattedCustomerId = customerId.replace(/-/g, '');

    const configRecord = await prisma.integrationConfig.upsert({
        where: {
            companyId_provider: {
                companyId: companyUser.companyId,
                provider: 'google_ads'
            }
        },
        update: {
            config: {
                customerId: formattedCustomerId,
                developerToken,
                clientId,
                clientSecret,
                refreshToken
            },
            isEnabled: true
        },
        create: {
            companyId: companyUser.companyId,
            provider: 'google_ads',
            config: {
                customerId: formattedCustomerId,
                developerToken,
                clientId,
                clientSecret,
                refreshToken
            },
            isEnabled: true
        }
    });

    return { success: true, configId: configRecord.id };
}

/**
 * Fetches Real Campaigns from Google Ads REST API
 */
export async function getGoogleCampaigns() {
    const config = await getGoogleAdsConfig();
    if (!config || !config.isEnabled) {
        throw new Error("Google Ads is not configured or is disabled.");
    }

    const { customerId, developerToken, clientId, clientSecret, refreshToken } = config.config as any;

    try {
        const accessToken = await getFreshAccessToken(clientId, clientSecret, refreshToken);

        // GAQL Query to get campaigns
        const query = `
            SELECT campaign.id, campaign.name, campaign.status, campaign.advertising_channel_type
            FROM campaign
            WHERE campaign.status != 'REMOVED'
            ORDER BY campaign.id
        `;

        const response = await fetch(
            `${GOOGLE_ADS_REST_URL}/customers/${customerId}/googleAds:searchStream`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'developer-token': developerToken,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ query })
            }
        );

        if (!response.ok) {
            const errBody = await response.text();
            console.error("Google Ads API Error:", errBody);
            throw new Error(`Failed to fetch Google campaigns: ${response.statusText}`);
        }

        const data = await response.json();
        // Typically returns an array of CustomerRow objects or similar depending on search/searchStream
        return data;
    } catch (error) {
        console.error("Failed to get Google campaigns:", error);
        throw error;
    }
}

/**
 * Fetches campaign performance insights (spend, clicks, etc) from Google Ads API
 */
export async function getGoogleInsights(dateRange = 'LAST_30_DAYS') {
    const config = await getGoogleAdsConfig();
    if (!config || !config.isEnabled) {
        throw new Error("Google Ads is not configured or is disabled.");
    }

    const { customerId, developerToken, clientId, clientSecret, refreshToken } = config.config as any;

    try {
        const accessToken = await getFreshAccessToken(clientId, clientSecret, refreshToken);

        // GAQL Query for metrics spanning the chosen range
        const query = `
            SELECT campaign.id, campaign.name, metrics.impressions, metrics.clicks, metrics.cost_micros, metrics.conversions
            FROM campaign
            WHERE segments.date DURING ${dateRange}
        `;

        const response = await fetch(
            `${GOOGLE_ADS_REST_URL}/customers/${customerId}/googleAds:searchStream`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'developer-token': developerToken,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ query })
            }
        );

        if (!response.ok) {
            const errBody = await response.text();
            console.error("Google Ads API Error:", errBody);
            throw new Error(`Failed to fetch Google insights: ${response.statusText}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Failed to get Google insights:", error);
        throw error;
    }
}
