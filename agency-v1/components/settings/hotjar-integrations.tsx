import { Flame } from "lucide-react";
import { IntegrationConfigDialog } from "./integration-config-dialog";
import { getIntegrationConfig } from "@/actions/integration-config";
import { IntegrationAppCard } from "./integration-app-card";

export async function HotjarIntegrations() {
    // Fetch DB Config for Hotjar
    const config = await getIntegrationConfig('hotjar');
    const isConfigured = !!config?.siteId;

    return (
        <IntegrationAppCard
            name="Hotjar"
            description="Software de mapas de calor, grabaciones de sesiones y encuestas en vivo."
            icon={<Flame className="w-6 h-6 text-[#FD3259]" />}
            brandColor="bg-gradient-to-r from-[#FD3259] to-rose-400"
            status={isConfigured ? "connected" : "disconnected"}
            providerLink="https://insights.hotjar.com/"
            customConfigureButton={<IntegrationConfigDialog provider="hotjar" title="Hotjar" />}
            metrics={isConfigured ? [{ label: "Site ID", value: String(config.siteId) }] : undefined}
        />
    );
}
