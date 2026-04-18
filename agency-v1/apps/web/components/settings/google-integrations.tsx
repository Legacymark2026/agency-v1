import { BarChart3, Activity } from "lucide-react";
import { IntegrationConfigDialog } from "./integration-config-dialog";
import { getIntegrationConfig } from "@/actions/integration-config";
import { IntegrationAppCard } from "./integration-app-card";

export async function GoogleIntegrations() {
    // Fetch DB Config for Google Analytics and GTM separately
    const gaConfig = await getIntegrationConfig('google-analytics');
    const gtmConfig = await getIntegrationConfig('google-tag-manager');

    // GA4 is configured when it has a Measurement ID (G-XXXXXXXX) for browser tracking
    const isGaConfigured = !!gaConfig?.measurementId;
    // GTM is configured when it has a Container ID
    const isGtmConfigured = !!gtmConfig?.containerId;

    return (
        <>
            <IntegrationAppCard
                name="Google Analytics 4"
                description="Analítica avanzada, seguimiento de eventos del lado del servidor y reportes."
                icon={<BarChart3 className="w-6 h-6 text-[#F9AB00]" />}
                brandColor="bg-gradient-to-r from-[#F9AB00] to-orange-400"
                status={isGaConfigured ? "connected" : "disconnected"}
                providerLink="https://analytics.google.com/"
                customConfigureButton={<IntegrationConfigDialog provider="google-analytics" title="Google Analytics 4" />}
                metrics={isGaConfigured ? [{ label: "Measurement ID", value: String(gaConfig?.measurementId) }] : undefined}
            />

            <IntegrationAppCard
                name="Google Tag Manager"
                description="Administra todas las etiquetas de tu sitio web de forma rápida y centralizada."
                icon={<Activity className="w-6 h-6 text-blue-600" />}
                brandColor="bg-gradient-to-r from-blue-500 to-teal-400"
                status={isGtmConfigured ? "connected" : "disconnected"}
                providerLink="https://tagmanager.google.com/"
                customConfigureButton={<IntegrationConfigDialog provider="google-tag-manager" title="Google Tag Manager" />}
                metrics={isGtmConfigured ? [{ label: "Container ID", value: String(gtmConfig?.containerId) }] : undefined}
            />
        </>
    );
}
