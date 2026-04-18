'use server';

import { db as prisma } from '@/lib/db';
import { auth } from '@/lib/auth';

const FB_GRAPH_URL = 'https://graph.facebook.com/v19.0';

/**
 * Gets the stored Facebook Ads configuration for the current company.
 * FIX #1: Now searches ALL relevant providers in priority order to avoid
 * the desync between OAuth callback (saves to 'facebook'/'meta-app'/'facebook-page')
 * and the dispatch service (previously only looked at 'facebook_ads').
 */
export async function getFacebookAdsConfig() {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");

    const companyUser = await prisma.companyUser.findFirst({
        where: { userId: session.user.id },
        select: { companyId: true }
    });

    if (!companyUser) throw new Error("Company not found");

    // FIX: Check all provider keys in priority order
    const PROVIDER_PRIORITY = [
        'facebook_ads',    // explicit ads config (has adAccountId)
        'meta-app',        // new OAuth family (has appId/appSecret)
        'facebook-page',   // new OAuth family (has page-level accessToken)
        'facebook',        // legacy OAuth entry
    ];

    for (const provider of PROVIDER_PRIORITY) {
        const config = await prisma.integrationConfig.findUnique({
            where: {
                companyId_provider: {
                    companyId: companyUser.companyId,
                    provider
                }
            }
        });

        if (config && config.isEnabled) {
            const cfg = config.config as any;

            // Merge: build a unified config from available fields
            // 'facebook_ads' has adAccountId + accessToken directly
            // Other providers may only have accessToken; fallback adAccountId to env
            if (!cfg?.adAccountId && provider !== 'facebook_ads') {
                // Try to get adAccountId from env or another config
                const adsConfig = await prisma.integrationConfig.findUnique({
                    where: {
                        companyId_provider: {
                            companyId: companyUser.companyId,
                            provider: 'facebook_ads'
                        }
                    }
                });
                const adAccountId = (adsConfig?.config as any)?.adAccountId
                    || process.env.FACEBOOK_AD_ACCOUNT_ID
                    || null;

                if (!adAccountId) {
                    console.warn(`[getFacebookAdsConfig] No adAccountId found for provider '${provider}'. Continuing search...`);
                    continue;
                }

                return {
                    ...config,
                    config: {
                        ...cfg,
                        adAccountId,
                    }
                };
            }

            console.log(`[getFacebookAdsConfig] Resolved config from provider: '${provider}'`);
            return config;
        }
    }

    return null;
}

/**
 * Saves or updates the Facebook Ads credentials.
 * Persists to BOTH the dedicated 'facebook_ads' provider AND the meta-app family.
 */
export async function connectFacebookAds(adAccountId: string, accessToken: string) {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");

    const companyUser = await prisma.companyUser.findFirst({
        where: { userId: session.user.id },
        select: { companyId: true }
    });

    if (!companyUser) throw new Error("Company not found");

    const formattedAccountId = adAccountId.startsWith('act_') ? adAccountId : `act_${adAccountId}`;

    // Save to dedicated facebook_ads provider (has adAccountId)
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

    // Also update facebook-page token for cross-module consistency
    await prisma.integrationConfig.upsert({
        where: {
            companyId_provider: {
                companyId: companyUser.companyId,
                provider: 'facebook-page'
            }
        },
        update: {
            config: { accessToken, adAccountId: formattedAccountId } as any,
            isEnabled: true
        },
        create: {
            companyId: companyUser.companyId,
            provider: 'facebook-page',
            config: { accessToken, adAccountId: formattedAccountId } as any,
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
