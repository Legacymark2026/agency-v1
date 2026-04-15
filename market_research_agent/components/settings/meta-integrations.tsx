import { getConnectedIntegrations } from "@/actions/integrations";
import { Facebook, MessageSquare, Activity, Linkedin, Music2, Megaphone } from "lucide-react";
import { MetaConnectButton } from "./meta-connect-button";
import { MetaDisconnectButton } from "./meta-disconnect-button";
import { IntegrationConfigDialog } from "./integration-config-dialog";
import { getIntegrationConfig } from "@/actions/integration-config";
import { IntegrationAppCard } from "./integration-app-card";

export async function MetaIntegrations() {
    const integrations = await getConnectedIntegrations();
    const fb = integrations.find(i => i.provider === 'facebook');
    const isFacebookConnected = fb?.connected;

    // Fetch DB Config specifically for Facebook to get the App ID
    const fbConfig = await getIntegrationConfig('facebook');
    const waConfig = await getIntegrationConfig('whatsapp');
    const pixelConfig = await getIntegrationConfig('facebook-pixel');
    const tiktokConfig = await getIntegrationConfig('tiktok-pixel');
    const linkedinConfig = await getIntegrationConfig('linkedin-insight');
    const googleAdsConfig = await getIntegrationConfig('google-ads');

    // Check if WhatsApp is configured (has Phone ID and Access Token)
    const isWhatsappConfigured = !!waConfig?.phoneNumberId && !!waConfig?.accessToken;
    const dbAppId = fbConfig?.appId;
    const activeAppId = dbAppId || process.env.FACEBOOK_CLIENT_ID || "";

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
                onDisconnect={isFacebookConnected ? undefined : undefined} // Handled by a separate custom button if needed or we just don't pass it and let the custom button do it
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
            />

            <IntegrationAppCard
                name="TikTok Pixel & Events API"
                description="Rastrea eventos y maximiza el retorno de anuncios en la red de TikTok."
                icon={<Music2 className="w-6 h-6 text-pink-600" />}
                brandColor="bg-gradient-to-r from-pink-600 to-rose-400"
                status={tiktokConfig?.tiktokPixelId ? "connected" : "disconnected"}
                providerLink="https://ads.tiktok.com/i18n/events"
                customConfigureButton={<IntegrationConfigDialog provider="tiktok-pixel" title="TikTok Pixel" />}
                metrics={tiktokConfig?.tiktokPixelId ? [{ label: "Pixel ID", value: String(tiktokConfig.tiktokPixelId) }] : undefined}
            />

            <IntegrationAppCard
                name="LinkedIn Insight Tag & CAPI"
                description="Sincroniza conversiones B2B de forma precisa con el servidor de LinkedIn."
                icon={<Linkedin className="w-6 h-6 text-[#0A66C2]" />}
                brandColor="bg-gradient-to-r from-[#0A66C2] to-blue-400"
                status={linkedinConfig?.linkedinPartnerId ? "connected" : "disconnected"}
                providerLink="https://www.linkedin.com/campaignmanager"
                customConfigureButton={<IntegrationConfigDialog provider="linkedin-insight" title="LinkedIn Insight Tag" />}
                metrics={linkedinConfig?.linkedinPartnerId ? [{ label: "Partner ID", value: String(linkedinConfig.linkedinPartnerId) }] : undefined}
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
            />
        </>
    );
}
