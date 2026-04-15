import { getConnectedIntegrations } from "@/actions/integrations";
import { Facebook, MessageSquare, Activity, Linkedin, Music2, Megaphone } from "lucide-react";
import { MetaConnectButton } from "./meta-connect-button";
import { IntegrationConfigDialog } from "./integration-config-dialog";
import { getIntegrationConfig } from "@/actions/integration-config";
import { IntegrationAppCard } from "./integration-app-card";
import { Suspense } from "react";

function MetaIntegrationsSkeleton() {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[1,2,3,4,5,6].map(i => (
                <div key={i} className="h-40 rounded-xl bg-slate-800/30 animate-pulse" />
            ))}
        </div>
    );
}

export function MetaIntegrations() {
    return (
        <Suspense fallback={<MetaIntegrationsSkeleton />}>
            <MetaIntegrationsContent />
        </Suspense>
    );
}

async function MetaIntegrationsContent() {
    let integrations: any[] = [];
    try {
        integrations = await getConnectedIntegrations();
    } catch (e) {
        console.error("Error fetching connected integrations:", e);
    }
    
    const fb = integrations?.find(i => i.provider === 'facebook');
    const isFacebookConnected = fb?.connected;

    let fbConfig = null;
    let waConfig = null;
    let pixelConfig = null;
    let tiktokPixelConfig = null;
    let tiktokMessagesConfig = null;
    let linkedinInsightConfig = null;
    let linkedinWebhookConfig = null;
    let googleAdsConfig = null;
    
    try {
        fbConfig = await getIntegrationConfig('facebook' as any) as any;
    } catch (e) { console.error("Error getting fb config:", e); }
    try {
        waConfig = await getIntegrationConfig('whatsapp');
    } catch (e) { console.error("Error getting wa config:", e); }
    try {
        pixelConfig = await getIntegrationConfig('facebook-pixel' as any) as any;
    } catch (e) { console.error("Error getting pixel config:", e); }
    try {
        tiktokPixelConfig = await getIntegrationConfig('tiktok-ads');
    } catch (e) { console.error("Error getting tiktok ads config:", e); }
    try {
        tiktokMessagesConfig = await getIntegrationConfig('tiktok-messages');
    } catch (e) { console.error("Error getting tiktok messages config:", e); }
    try {
        linkedinInsightConfig = await getIntegrationConfig('linkedin-ads');
    } catch (e) { console.error("Error getting linkedin ads config:", e); }
    try {
        linkedinWebhookConfig = await getIntegrationConfig('linkedin-webhook');
    } catch (e) { console.error("Error getting linkedin webhook config:", e); }
    try {
        googleAdsConfig = await getIntegrationConfig('google-ads');
    } catch (e) { console.error("Error getting google ads config:", e); }

    // Check if WhatsApp is configured (has Phone ID and Access Token)
    const isWhatsappConfigured = !!waConfig?.phoneNumberId && !!waConfig?.accessToken;
    const dbAppId = fbConfig?.appId;
    const activeAppId = dbAppId || process.env.META_APP_ID || process.env.FACEBOOK_CLIENT_ID || "";
    
    // Check if Facebook is configured (either via Account table OR IntegrationConfig)
    const isFacebookConfigured = isFacebookConnected || (!!fbConfig && !!fbConfig.appId);

    // Smart Redirect URI Calculation
    let serverOrigin = "";
    if (process.env.NEXTAUTH_URL && !process.env.NEXTAUTH_URL.includes("localhost")) {
        serverOrigin = process.env.NEXTAUTH_URL;
    } else if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
        serverOrigin = `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
    }
    const computedRedirectUri = serverOrigin ? `${serverOrigin}/api/integrations/facebook/callback` : undefined;

    return (
        <>
            <IntegrationAppCard
                name="Facebook & Instagram"
                description="Conecta el Graph API para Páginas, Mensajes y Anuncios de forma unificada."
                icon={<Facebook className="w-6 h-6 text-[#1877F2]" />}
                brandColor="bg-gradient-to-r from-[#1877F2] to-blue-400"
                status={isFacebookConnected ? "connected" : "disconnected"}
                providerLink="https://developers.facebook.com/apps"
                customConnectButton={
                    <MetaConnectButton
                        provider="facebook"
                        appId={activeAppId}
                        redirectUri={computedRedirectUri}
                    />
                }
                customConfigureButton={<IntegrationConfigDialog provider="facebook" title="Meta" />}
                providerId={isFacebookConfigured ? "facebook" : undefined}
            />

            <IntegrationAppCard
                name="WhatsApp Business API"
                description="Integración oficial Cloud API para mensajería a escala y automatización."
                icon={<MessageSquare className="w-6 h-6 text-[#25D366]" />}
                brandColor="bg-gradient-to-r from-[#25D366] to-emerald-400"
                status={isWhatsappConfigured ? "connected" : "disconnected"}
                providerLink="https://developers.facebook.com/docs/whatsapp/cloud-api"
                customConfigureButton={<IntegrationConfigDialog provider="whatsapp" title="WhatsApp Business" />}
                metrics={isWhatsappConfigured ? [{ label: "Envios (Mes)", value: "0 / 1000" }] : undefined}
                providerId={isWhatsappConfigured ? "whatsapp" : undefined}
            />

            <IntegrationAppCard
                name="Meta Pixel"
                description="Rastreador de conversiones para optimizar el rendimiento de la publicidad."
                icon={<Activity className="w-6 h-6 text-indigo-600" />}
                brandColor="bg-gradient-to-r from-blue-600 to-indigo-600"
                status={pixelConfig?.pixelId ? "connected" : "disconnected"}
                providerLink="https://business.facebook.com/events_manager2"
                customConfigureButton={<IntegrationConfigDialog provider="facebook-pixel" title="Meta Pixel" />}
                metrics={pixelConfig?.pixelId ? [{ label: "Pixel ID", value: String(pixelConfig.pixelId) }] : undefined}
                providerId={pixelConfig?.pixelId ? "facebook-pixel" : undefined}
            />

            <IntegrationAppCard
                name="TikTok Pixel & Events API"
                description="Rastrea eventos y maximiza el retorno de anuncios en la red de TikTok."
                icon={<Music2 className="w-6 h-6 text-pink-600" />}
                brandColor="bg-gradient-to-r from-pink-600 to-rose-400"
                status={tiktokPixelConfig?.tiktokPixelId ? "connected" : "disconnected"}
                providerLink="https://ads.tiktok.com/i18n/events"
                customConfigureButton={<IntegrationConfigDialog provider="tiktok-ads" title="TikTok Ads" />}
                metrics={tiktokPixelConfig?.tiktokPixelId ? [{ label: "Pixel ID", value: String(tiktokPixelConfig.tiktokPixelId) }] : undefined}
                providerId={tiktokPixelConfig?.tiktokPixelId ? "tiktok-ads" : undefined}
            />

            <IntegrationAppCard
                name="TikTok Comments & Webhooks"
                description="Recibe comentarios webhooks de TikTok para tu CRM."
                icon={<Music2 className="w-6 h-6 text-pink-500" />}
                brandColor="bg-gradient-to-r from-pink-500 to-rose-500"
                status={tiktokMessagesConfig?.tiktokWebhookSecret ? "connected" : "disconnected"}
                providerLink="https://developers.tiktok.com"
                customConfigureButton={<IntegrationConfigDialog provider="tiktok-messages" title="TikTok Webhooks" />}
                providerId={tiktokMessagesConfig?.tiktokWebhookSecret ? "tiktok-messages" : undefined}
            />

            <IntegrationAppCard
                name="LinkedIn Insight Tag & CAPI"
                description="Sincroniza conversiones B2B de forma precisa con el servidor de LinkedIn."
                icon={<Linkedin className="w-6 h-6 text-[#0A66C2]" />}
                brandColor="bg-gradient-to-r from-[#0A66C2] to-blue-400"
                status={linkedinInsightConfig?.linkedinPartnerId ? "connected" : "disconnected"}
                providerLink="https://www.linkedin.com/campaignmanager"
                customConfigureButton={<IntegrationConfigDialog provider="linkedin-ads" title="LinkedIn Ads" />}
                metrics={linkedinInsightConfig?.linkedinPartnerId ? [{ label: "Partner ID", value: String(linkedinInsightConfig.linkedinPartnerId) }] : undefined}
                providerId={linkedinInsightConfig?.linkedinPartnerId ? "linkedin-ads" : undefined}
            />

            <IntegrationAppCard
                name="LinkedIn Organization Webhooks"
                description="Recibe webhooks de estado de organización y seguidores de LinkedIn."
                icon={<Linkedin className="w-6 h-6 text-[#0A66C2]" />}
                brandColor="bg-gradient-to-r from-[#0A66C2] to-cyan-400"
                status={linkedinWebhookConfig?.linkedinWebhookSecret ? "connected" : "disconnected"}
                providerLink="https://www.linkedin.com/feed"
                customConfigureButton={<IntegrationConfigDialog provider="linkedin-webhook" title="LinkedIn Webhooks" />}
                providerId={linkedinWebhookConfig?.linkedinWebhookSecret ? "linkedin-webhook" : undefined}
            />

            <IntegrationAppCard
                name="Google & YouTube Ads"
                description="Habilita conversiones mejoradas y remarketing en la red de búsqueda, display y video (YouTube)."
                icon={<Megaphone className="w-6 h-6 text-[#4285F4]" />}
                brandColor="bg-gradient-to-r from-[#4285F4] to-blue-400"
                status={googleAdsConfig?.googleAdsId ? "connected" : "disconnected"}
                providerLink="https://ads.google.com"
                customConfigureButton={<IntegrationConfigDialog provider="google-ads" title="Google & YouTube Ads" />}
                metrics={googleAdsConfig?.googleAdsId ? [{ label: "AW Tag ID", value: String(googleAdsConfig.googleAdsId) }] : undefined}
                providerId={googleAdsConfig?.googleAdsId ? "google-ads" : undefined}
            />
        </>
    );
}
