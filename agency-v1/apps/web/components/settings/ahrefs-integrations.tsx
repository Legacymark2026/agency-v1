import { Activity } from "lucide-react";
import { IntegrationConfigDialog } from "./integration-config-dialog";
import { getIntegrationConfig } from "@/actions/integration-config";
import { IntegrationAppCard } from "./integration-app-card";

export async function AhrefsIntegrations() {
    // Fetch DB Config for Ahrefs
    const config = await getIntegrationConfig('ahrefs');
    const isConfigured = !!config?.dataKey;

    return (
        <IntegrationAppCard
            name="Ahrefs"
            description="Ahrefs Web Analytics (sin cookies) para analítica de visitantes."
            icon={<Activity className="w-6 h-6 text-[#F97316]" />}
            brandColor="bg-gradient-to-r from-[#F97316] to-orange-400"
            status={isConfigured ? "connected" : "disconnected"}
            providerLink="https://ahrefs.com/webmaster-tools"
            customConfigureButton={<IntegrationConfigDialog provider="ahrefs" title="Ahrefs" />}
            metrics={isConfigured ? [{ label: "Data Key", value: String(config.dataKey).slice(0, 8) + '...' }] : undefined}
        />
    );
}
