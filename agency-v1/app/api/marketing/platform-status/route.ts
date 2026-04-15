import { NextRequest, NextResponse } from 'next/server';
import { db as prisma } from '@/lib/db';
import { auth } from '@/lib/auth';

/**
 * GET /api/marketing/platform-status
 *
 * Returns the connection status of each ad platform for the current company.
 * Used by StepPlatform to show ✅/⚠️ badges without blocking the UI.
 *
 * Response: { FACEBOOK_ADS: boolean, GOOGLE_ADS: boolean, TIKTOK_ADS: boolean, LINKEDIN_ADS: boolean }
 */
export async function GET(_req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const companyUser = await prisma.companyUser.findFirst({
            where: { userId: session.user.id },
            select: { companyId: true }
        });

        if (!companyUser) {
            return NextResponse.json({ error: 'Company not found' }, { status: 404 });
        }

        const { companyId } = companyUser;

        // Fetch all relevant integration configs in a single query
        const configs = await prisma.integrationConfig.findMany({
            where: {
                companyId,
                isEnabled: true,
                provider: {
                    in: [
                        // Facebook / Meta
                        'facebook_ads', 'facebook-page', 'facebook', 'meta-app',
                        // Google
                        'google-ads', 'google_ads',
                        // TikTok
                        'tiktok-ads', 'tiktok_ads',
                        // LinkedIn
                        'linkedin-ads', 'linkedin-insight',
                    ]
                }
            },
            select: { provider: true, isEnabled: true, config: true }
        });

        // Helpers to check if a config has actual credentials
        function hasFBCreds() {
            return configs.some(c => {
                const cfg = c.config as any;
                const isFBProvider = ['facebook_ads', 'facebook-page', 'facebook', 'meta-app'].includes(c.provider);
                if (!isFBProvider) return false;
                const hasToken = !!(cfg?.accessToken || cfg?.pageAccessToken);
                const hasAccount = !!(cfg?.adAccountId) || !!(process.env.FACEBOOK_AD_ACCOUNT_ID);
                return hasToken || (c.provider === 'facebook_ads' && hasAccount);
            });
        }

        function hasGoogleCreds() {
            return configs.some(c => {
                const cfg = c.config as any;
                const isGoogle = ['google-ads', 'google_ads'].includes(c.provider);
                return isGoogle && !!(cfg?.accessToken || cfg?.developerToken || cfg?.googleAdsAccessToken);
            });
        }

        function hasTikTokCreds() {
            return configs.some(c => {
                const cfg = c.config as any;
                const isTT = ['tiktok-ads', 'tiktok_ads'].includes(c.provider);
                return isTT && !!(cfg?.accessToken || cfg?.tiktokAccessToken);
            });
        }

        function hasLinkedInCreds() {
            return configs.some(c => {
                const cfg = c.config as any;
                const isLI = ['linkedin-ads', 'linkedin-insight'].includes(c.provider);
                return isLI && !!(cfg?.accessToken || cfg?.linkedinAccessToken);
            });
        }

        const status = {
            FACEBOOK_ADS: hasFBCreds(),
            GOOGLE_ADS: hasGoogleCreds(),
            TIKTOK_ADS: hasTikTokCreds(),
            LINKEDIN_ADS: hasLinkedInCreds(),
        };

        return NextResponse.json(status);
    } catch (err) {
        console.error('[platform-status] Error:', err);
        return NextResponse.json({
            FACEBOOK_ADS: false,
            GOOGLE_ADS: false,
            TIKTOK_ADS: false,
            LINKEDIN_ADS: false,
        });
    }
}
