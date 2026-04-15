'use server';

import { db as prisma } from '@/lib/db';

// ─── TYPES ────────────────────────────────────────────────────────────────────

export type AdPlatform =
    | 'facebook_ads'
    | 'google_ads'
    | 'tiktok_ads'
    | 'linkedin_ads';

interface PlatformConfig {
    accessToken?: string;
    refreshToken?: string;
    clientId?: string;
    clientSecret?: string;
    adAccountId?: string;
    advertiserId?: string;
    accountId?: string;
    customerId?: string;
    developerToken?: string;
    tokenExpiresAt?: number; // Unix timestamp
    [key: string]: unknown;
}

// ─── CORE ─────────────────────────────────────────────────────────────────────

/**
 * Returns the IntegrationConfig for a given companyId + platform.
 * Throws if not found or disabled.
 */
export async function getIntegrationConfig(companyId: string, provider: AdPlatform) {
    const config = await prisma.integrationConfig.findUnique({
        where: { companyId_provider: { companyId, provider } },
    });

    if (!config || !config.isEnabled) {
        throw new Error(`Integration "${provider}" is not configured or disabled for company ${companyId}.`);
    }

    return config;
}

/**
 * Retrieves a valid access token for the given platform.
 * - For Google Ads: automatically refreshes using the stored refresh_token.
 * - For Meta / TikTok / LinkedIn: returns the stored long-lived token.
 *   If the token expires within 7 days, logs a warning (alerting can be
 *   extended to email notifications in the future).
 */
export async function getValidToken(companyId: string, provider: AdPlatform): Promise<string> {
    const config = await getIntegrationConfig(companyId, provider);
    const cfg = config.config as PlatformConfig;

    switch (provider) {
        case 'google_ads':
            return refreshGoogleToken(cfg);

        case 'facebook_ads':
        case 'tiktok_ads':
        case 'linkedin_ads': {
            const token = cfg.accessToken;
            if (!token) throw new Error(`No access token found for ${provider}.`);

            // Warn if token will expire within 7 days
            if (cfg.tokenExpiresAt) {
                const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
                if (Date.now() > cfg.tokenExpiresAt - sevenDaysMs) {
                    console.warn(
                        `[TokenManager] Token for ${provider} (company: ${companyId}) expires soon. ` +
                        `Expires at: ${new Date(cfg.tokenExpiresAt).toISOString()}`
                    );
                }
            }

            return token;
        }

        default:
            throw new Error(`Unknown platform: ${provider}`);
    }
}

// ─── GOOGLE OAUTH2 REFRESH ────────────────────────────────────────────────────

const GOOGLE_OAUTH_TOKEN_URL = 'https://oauth2.googleapis.com/token';

async function refreshGoogleToken(cfg: PlatformConfig): Promise<string> {
    const { clientId: cfgClientId, clientSecret: cfgClientSecret, refreshToken } = cfg;
    const clientId = cfgClientId || process.env.GOOGLE_CLIENT_ID;
    const clientSecret = cfgClientSecret || process.env.GOOGLE_CLIENT_SECRET;

    if (!clientId || !clientSecret || !refreshToken) {
        throw new Error('Google Ads: missing clientId, clientSecret, or refreshToken.');
    }

    const res = await fetch(GOOGLE_OAUTH_TOKEN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            client_id: clientId as string,
            client_secret: clientSecret as string,
            refresh_token: refreshToken as string,
            grant_type: 'refresh_token',
        }),
    });

    const data = await res.json();

    if (data.error) {
        throw new Error(`Google token refresh failed: ${data.error_description ?? data.error}`);
    }

    return data.access_token as string;
}

// ─── HELPERS FOR DISPATCH FILES ───────────────────────────────────────────────

/**
 * Convenience: returns the full config + a valid token in one call.
 * Used by dispatch files to avoid repeating the same pattern.
 */
export async function getPlatformContext(companyId: string, provider: AdPlatform) {
    const config = await getIntegrationConfig(companyId, provider);
    const token = await getValidToken(companyId, provider);
    const cfg = config.config as PlatformConfig;

    return { cfg, token, config };
}

/**
 * Stores or updates an integration config — thin wrapper that also
 * normalizes provider-specific field formats.
 */
export async function saveIntegrationConfig(
    companyId: string,
    provider: AdPlatform,
    data: PlatformConfig
) {
    await prisma.integrationConfig.upsert({
        where: { companyId_provider: { companyId, provider } },
        update: { config: data as object, isEnabled: true },
        create: { companyId, provider, config: data as object, isEnabled: true },
    });
    return { success: true };
}
