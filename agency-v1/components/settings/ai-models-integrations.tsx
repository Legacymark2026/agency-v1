import { Bot } from "lucide-react";
import { IntegrationConfigDialog } from "./integration-config-dialog";
import { getIntegrationConfig } from "@/actions/integration-config";
import { IntegrationAppCard } from "./integration-app-card";

export async function AiModelsIntegrations() {
    let aiConfig = await getIntegrationConfig('ai-models');
    
    // Fallback for backwards compatibility with the old 'gemini' row
    if (!aiConfig) {
        const geminiConfig = await getIntegrationConfig('gemini');
        if (geminiConfig?.geminiApiKey) {
            aiConfig = geminiConfig;
        }
    }

    const metrics: { label: string; value: string }[] = [];
    
    if (aiConfig?.openAiApiKey) metrics.push({ label: "OpenAI", value: 'sk-... ' + aiConfig.openAiApiKey.slice(-4) });
    if (aiConfig?.anthropicApiKey) metrics.push({ label: "Anthropic", value: 'sk-ant-... ' + aiConfig.anthropicApiKey.slice(-4) });
    if (aiConfig?.geminiApiKey) metrics.push({ label: "Gemini", value: 'AIz... ' + aiConfig.geminiApiKey.slice(-4) });
    if (aiConfig?.deepseekApiKey) metrics.push({ label: "DeepSeek", value: 'sk-... ' + aiConfig.deepseekApiKey.slice(-4) });
    if (aiConfig?.mistralApiKey) metrics.push({ label: "Mistral", value: '... ' + aiConfig.mistralApiKey.slice(-4) });
    if (aiConfig?.xaiApiKey) metrics.push({ label: "Grok", value: '... ' + aiConfig.xaiApiKey.slice(-4) });

    const isConfigured = metrics.length > 0;

    return (
        <IntegrationAppCard
            name="Frontier AI Models & LLMs"
            description="Motor cognitivo para los agentes autónomos. Soporta los modelos más avanzados: OpenAI (GPT-o), Anthropic (Claude), Google (Gemini), DeepSeek, Mistral y xAI (Grok)."
            icon={<Bot className="w-6 h-6 text-white" />}
            brandColor="bg-gradient-to-r from-violet-600 to-fuchsia-600"
            status={isConfigured ? "connected" : "disconnected"}
            providerLink="#"
            customConfigureButton={<IntegrationConfigDialog provider="ai-models" title="Modelos de Inteligencia Artificial" />}
            metrics={isConfigured ? metrics : undefined}
        />
    );
}
