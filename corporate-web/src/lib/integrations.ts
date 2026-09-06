import { prisma } from "@/lib/prisma";

export interface PublicIntegrations {
  googleTagManagerId?: string;
  googleAnalyticsId?: string;
  googleSearchConsoleMeta?: string;
  facebookPixelId?: string;
  tiktokPixelId?: string;
  linkedinPartnerId?: string;
  gtmEnabled: boolean;
  gaEnabled: boolean;
  gscEnabled: boolean;
  fbEnabled: boolean;
  tiktokEnabled: boolean;
  linkedinEnabled: boolean;
}

export async function getActiveIntegrations(): Promise<PublicIntegrations | null> {
  try {
    const config = await prisma.integrationConfig.findUnique({
      where: { id: "default" },
    });

    if (!config) return null;

    return {
      googleTagManagerId: config.gtmEnabled ? config.googleTagManagerId || "" : "",
      googleAnalyticsId: config.gaEnabled ? config.googleAnalyticsId || "" : "",
      googleSearchConsoleMeta: config.gscEnabled ? config.googleSearchConsoleMeta || "" : "",
      facebookPixelId: config.fbEnabled ? config.facebookPixelId || "" : "",
      tiktokPixelId: config.tiktokEnabled ? config.tiktokPixelId || "" : "",
      linkedinPartnerId: config.linkedinEnabled ? config.linkedinPartnerId || "" : "",
      gtmEnabled: config.gtmEnabled && Boolean(config.googleTagManagerId),
      gaEnabled: config.gaEnabled && Boolean(config.googleAnalyticsId),
      gscEnabled: config.gscEnabled && Boolean(config.googleSearchConsoleMeta),
      fbEnabled: config.fbEnabled && Boolean(config.facebookPixelId),
      tiktokEnabled: config.tiktokEnabled && Boolean(config.tiktokPixelId),
      linkedinEnabled: config.linkedinEnabled && Boolean(config.linkedinPartnerId),
    };
  } catch (err) {
    console.error("Error loading active integrations:", err);
    return null;
  }
}
