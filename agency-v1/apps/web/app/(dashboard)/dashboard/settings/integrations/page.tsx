import { Plug2 } from "lucide-react";
import { IntegrationsToastHandler } from "@/components/settings/integrations-toast-handler";
import { IntegrationsHealthSummary } from "@/components/settings/integrations-health-summary";
import { AudienceSyncButton } from "@/components/settings/audience-sync-button";
import { IntegrationsCatalogClient } from "@/components/settings/integrations-catalog";
import { Suspense } from "react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getConnectedIntegrations } from "@/actions/integrations";
import { getIntegrationConfig } from "@/actions/integration-config";
import { getVideoAssetConfig } from "@/actions/integrations/video-assets";

export default async function IntegrationsPage() {
    const session = await auth();
    const connectedProvidersSet = new Set<string>();

    if (session?.user?.id) {
        const companyUser = await prisma.companyUser.findFirst({
            where: { userId: session.user.id },
            select: { companyId: true }
        });

        if (companyUser) {
            const configs = await prisma.integrationConfig.findMany({
                where: { companyId: companyUser.companyId }
            });
            configs.forEach(c => {
                if (c.isEnabled) {
                    connectedProvidersSet.add(c.provider.toLowerCase());
                }
            });
        }
    }

    // Retrieve Meta connection status
    let integrations: any[] = [];
    try {
        integrations = await getConnectedIntegrations();
    } catch (e) {
        console.error("Error fetching connected integrations:", e);
    }
    const fb = integrations?.find(i => i.provider === 'facebook');
    const facebookConnected = !!fb?.connected;

    // Load configs for all integration apps in parallel
    let facebookConfig = null;
    let whatsappConfig = null;
    let pixelConfig = null;
    let tiktokPixelConfig = null;
    let tiktokMessagesConfig = null;
    let linkedinInsightConfig = null;
    let linkedinWebhookConfig = null;
    let googleAdsConfig = null;
    let googleAnalyticsConfig = null;
    let googleTagManagerConfig = null;
    let googleSearchConsoleConfig = null;
    let hotjarConfig = null;
    let ahrefsConfig = null;
    let payuConfig = null;
    let aiModelsConfig = null;
    let rawVideoConfig = null;

    try {
        const results = await Promise.allSettled([
            getIntegrationConfig('facebook' as any),
            getIntegrationConfig('whatsapp'),
            getIntegrationConfig('facebook-pixel' as any),
            getIntegrationConfig('tiktok-ads'),
            getIntegrationConfig('tiktok-messages'),
            getIntegrationConfig('linkedin-ads'),
            getIntegrationConfig('linkedin-webhook'),
            getIntegrationConfig('google-ads'),
            getIntegrationConfig('google-analytics'),
            getIntegrationConfig('google-tag-manager'),
            getIntegrationConfig('google-search-console'),
            getIntegrationConfig('hotjar'),
            getIntegrationConfig('ahrefs'),
            getIntegrationConfig('payu' as any),
            getIntegrationConfig('ai-models'),
            getVideoAssetConfig()
        ]);

        if (results[0].status === 'fulfilled') facebookConfig = results[0].value;
        if (results[1].status === 'fulfilled') whatsappConfig = results[1].value;
        if (results[2].status === 'fulfilled') pixelConfig = results[2].value;
        if (results[3].status === 'fulfilled') tiktokPixelConfig = results[3].value;
        if (results[4].status === 'fulfilled') tiktokMessagesConfig = results[4].value;
        if (results[5].status === 'fulfilled') linkedinInsightConfig = results[5].value;
        if (results[6].status === 'fulfilled') linkedinWebhookConfig = results[6].value;
        if (results[7].status === 'fulfilled') googleAdsConfig = results[7].value;
        if (results[8].status === 'fulfilled') googleAnalyticsConfig = results[8].value;
        if (results[9].status === 'fulfilled') googleTagManagerConfig = results[9].value;
        if (results[10].status === 'fulfilled') googleSearchConsoleConfig = results[10].value;
        if (results[11].status === 'fulfilled') hotjarConfig = results[11].value;
        if (results[12].status === 'fulfilled') ahrefsConfig = results[12].value;
        if (results[13].status === 'fulfilled') payuConfig = results[13].value;
        if (results[14].status === 'fulfilled') aiModelsConfig = results[14].value;
        if (results[15].status === 'fulfilled') rawVideoConfig = results[15].value;
    } catch (e) {
        console.error("Error loading integration configurations in parallel:", e);
    }

    const activeAppId = facebookConfig?.appId || process.env.META_APP_ID || process.env.FACEBOOK_CLIENT_ID || "";

    // Smart Redirect URI Calculation
    let serverOrigin = "";
    if (process.env.NEXTAUTH_URL && !process.env.NEXTAUTH_URL.includes("localhost")) {
        serverOrigin = process.env.NEXTAUTH_URL;
    } else if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
        serverOrigin = `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
    }
    const computedRedirectUri = serverOrigin ? `${serverOrigin}/api/integrations/facebook/callback` : undefined;

    // Adapt video config to match component expectation
    const videoConfigAdapter = rawVideoConfig ? {
        ...rawVideoConfig,
        provider: 'video-assets',
        apiKey: rawVideoConfig.midjourney?.apiKey || rawVideoConfig.pexels?.apiKey || rawVideoConfig.elevenlabs?.apiKey || rawVideoConfig.suno?.apiKey || rawVideoConfig.runway?.apiKey || rawVideoConfig.adobeStock?.clientId || ''
    } : null;

    const catalogConfigs = {
        facebook: facebookConfig,
        whatsapp: whatsappConfig,
        pixel: pixelConfig,
        tiktokPixel: tiktokPixelConfig,
        tiktokMessages: tiktokMessagesConfig,
        linkedinInsight: linkedinInsightConfig,
        linkedinWebhook: linkedinWebhookConfig,
        googleAds: googleAdsConfig,
        googleAnalytics: googleAnalyticsConfig,
        googleTagManager: googleTagManagerConfig,
        googleSearchConsole: googleSearchConsoleConfig,
        hotjar: hotjarConfig,
        ahrefs: ahrefsConfig,
        payu: payuConfig,
        aiModels: aiModelsConfig,
        videoAssets: videoConfigAdapter
    };

    const connectedProviders = Array.from(connectedProvidersSet);

    return (
        <div className="space-y-10 pb-16 animate-in fade-in duration-500">
            <Suspense fallback={null}><IntegrationsToastHandler /></Suspense>

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[var(--ds-border)] pb-6 relative">
                {/* Decorative glow */}
                <div className="absolute -top-10 -left-10 w-40 h-40 bg-[var(--ds-teal-dim)]/50 blur-3xl rounded-full pointer-events-none" />
                
                <div className="relative">
                    <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-[0.15rem] bg-[var(--ds-teal-dim)] border border-[var(--ds-border-glow)] text-[var(--ds-teal-md)] text-xs uppercase font-mono tracking-widest mb-3">
                        <Plug2 className="w-3.5 h-3.5" /> App Store — Biblioteca
                    </div>
                    <div className="flex items-center gap-4">
                      <h2 className="text-3xl font-bold text-[var(--ds-text-primary)] tracking-tight leading-tight">Biblioteca de Integraciones</h2>
                      <AudienceSyncButton />
                    </div>
                    <p className="text-[var(--ds-text-secondary)] text-sm mt-2 max-w-xl leading-relaxed">
                        Explora, conecta y orquesta todo el ecosistema de integraciones operativas de LegacyMark. Centraliza credenciales, filtra por categorías y monitorea el estado de salud de cada conexión.
                    </p>
                </div>
            </div>

            {/* Health Summary - HUD Dashboard Style */}
            <IntegrationsHealthSummary />

            {/* Main Interactive Library Catalog Catalog */}
            <IntegrationsCatalogClient
                connectedProviders={connectedProviders}
                facebookConnected={facebookConnected}
                computedRedirectUri={computedRedirectUri}
                activeAppId={activeAppId}
                configs={catalogConfigs}
            />
        </div>
    );
}
