import { Video } from "lucide-react";
import { getVideoAssetConfig } from "@/actions/integrations/video-assets";
import { IntegrationAppCard } from "./integration-app-card";
import { VideoAssetConfigDialog } from "./video-asset-config-dialog";

export async function VideoAssetsIntegrations() {
    const videoConfig = await getVideoAssetConfig();
    
    const metrics: { label: string; value: string }[] = [];
    
    if (videoConfig?.midjourney?.apiKey) metrics.push({ label: "Midjourney", value: '🎨 Configured' });
    if (videoConfig?.pexels?.apiKey) metrics.push({ label: "Pexels", value: '📹 Configured' });
    if (videoConfig?.elevenlabs?.apiKey) metrics.push({ label: "ElevenLabs", value: '🎤 Configured' });
    if (videoConfig?.suno?.apiKey) metrics.push({ label: "Suno", value: '🎵 Configured' });
    if (videoConfig?.runway?.apiKey) metrics.push({ label: "Runway", value: '🎬 Configured' });
    if (videoConfig?.adobeStock?.clientId) metrics.push({ label: "Adobe Stock", value: '🏢 Configured' });

    const isConfigured = metrics.length > 0;

    return (
        <IntegrationAppCard
            name="Video & Content IA"
            description="APIs para generación de contenido: Midjourney (imágenes), Pexels (stock video), ElevenLabs (voz), Suno (música), Runway y Adobe Stock."
            icon={<Video className="w-6 h-6 text-white" />}
            brandColor="bg-gradient-to-r from-orange-500 to-red-500"
            status={isConfigured ? "connected" : "disconnected"}
            providerLink="#"
            customConfigureButton={
                <VideoAssetConfigDialog 
                    currentConfig={videoConfig ?? undefined} 
                />
            }
            metrics={isConfigured ? metrics : undefined}
        />
    );
}