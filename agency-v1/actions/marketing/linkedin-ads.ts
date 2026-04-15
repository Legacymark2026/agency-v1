'use server';

import { db as prisma } from '@/lib/db';
import { auth } from '@/lib/auth';

const LINKEDIN_API_URL = 'https://api.linkedin.com/rest'; // Uses mostly rest endpoints now

/**
 * Gets the stored LinkedIn Ads configuration for the current company.
 */
export async function getLinkedInAdsConfig() {
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
                provider: 'linkedin_ads'
            }
        }
    });

    return config;
}

/**
 * Saves or updates the LinkedIn Ads credentials.
 */
export async function connectLinkedInAds(adAccountId: string, accessToken: string) {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");

    const companyUser = await prisma.companyUser.findFirst({
        where: { userId: session.user.id },
        select: { companyId: true }
    });

    if (!companyUser) throw new Error("Company not found");

    const configRecord = await prisma.integrationConfig.upsert({
        where: {
            companyId_provider: {
                companyId: companyUser.companyId,
                provider: 'linkedin_ads'
            }
        },
        update: {
            config: { adAccountId, accessToken },
            isEnabled: true
        },
        create: {
            companyId: companyUser.companyId,
            provider: 'linkedin_ads',
            config: { adAccountId, accessToken },
            isEnabled: true
        }
    });

    return { success: true, configId: configRecord.id };
}

/**
 * Fetches Real Campaigns from LinkedIn API
 */
export async function getLinkedInCampaigns() {
    const config = await getLinkedInAdsConfig();
    if (!config || !config.isEnabled) {
        throw new Error("LinkedIn Ads is not configured or is disabled.");
    }

    const { adAccountId, accessToken } = config.config as any;

    try {
        const response = await fetch(
            `${LINKEDIN_API_URL}/adCampaigns?q=search&search=(account:(values:(urn:li:sponsoredAccount:${adAccountId})))`,
            {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'LinkedIn-Version': '202306',
                    'Content-Type': 'application/json'
                }
            }
        );

        if (!response.ok) {
            const errBody = await response.text();
            console.error("LinkedIn API Error:", errBody);
            throw new Error(`Failed to fetch LinkedIn campaigns: ${response.statusText}`);
        }

        const data = await response.json();
        return data.elements || [];
    } catch (error) {
        console.error("Failed to get LinkedIn campaigns:", error);
        throw error;
    }
}

/**
 * Fetches campaign performance insights from LinkedIn Analytics API.
 * Returns last 30 days metrics per campaign.
 */
export async function getLinkedInInsights(dateRange: { startDate: string; endDate: string } = {
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
}) {
    const config = await getLinkedInAdsConfig();
    if (!config || !config.isEnabled) {
        throw new Error("LinkedIn Ads is not configured or is disabled.");
    }

    const { adAccountId, accessToken } = config.config as any;
    const LINKEDIN_API_VERSION = '202306';

    try {
        const [startYear, startMonth, startDay] = dateRange.startDate.split('-');
        const [endYear, endMonth, endDay] = dateRange.endDate.split('-');

        const params = new URLSearchParams({
            q: 'analytics',
            pivot: 'CAMPAIGN',
            dateRange: JSON.stringify({
                start: { year: parseInt(startYear), month: parseInt(startMonth), day: parseInt(startDay) },
                end: { year: parseInt(endYear), month: parseInt(endMonth), day: parseInt(endDay) },
            }),
            fields: 'impressions,clicks,costInLocalCurrency,leadGenerationMailContactInfoShares,externalWebsiteConversions,dateRange',
            accounts: `List(urn:li:sponsoredAccount:${adAccountId})`,
        });

        const response = await fetch(
            `${LINKEDIN_API_URL}/adAnalytics?${params.toString()}`,
            {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'LinkedIn-Version': LINKEDIN_API_VERSION,
                    'X-RestLi-Protocol-Version': '2.0.0',
                    'Content-Type': 'application/json'
                }
            }
        );

        if (!response.ok) {
            const errBody = await response.text();
            console.error("LinkedIn Insights API Error:", errBody);
            throw new Error(`Failed to fetch LinkedIn insights: ${response.statusText}`);
        }

        const data = await response.json();
        return data.elements ?? [];
    } catch (error) {
        console.error("Failed to get LinkedIn insights:", error);
        throw error;
    }
}
