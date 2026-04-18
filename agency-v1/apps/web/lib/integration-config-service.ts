import { prisma } from "@/lib/prisma";
import { IntegrationProvider, IntegrationConfigData } from "@/actions/integration-config";

export async function getSystemIntegrationConfig(provider: string): Promise<IntegrationConfigData | null> {
    // In a single-tenant context, we just get the first enabled config for this provider.
    // In a multi-tenant context, we'd need the companyId from the webhook URL.
    const config = await prisma.integrationConfig.findFirst({
        where: {
            provider,
            isEnabled: true
        }
    });

    if (!config || !config.config) return null;

    return config.config as unknown as IntegrationConfigData;
}

export async function getCompanyIntegrationConfig(companyId: string, provider: string): Promise<IntegrationConfigData | null> {
    const config = await prisma.integrationConfig.findUnique({
        where: {
            companyId_provider: {
                companyId,
                provider
            }
        }
    });

    if (!config || !config.config) return null;

    return config.config as unknown as IntegrationConfigData;
}
