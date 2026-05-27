'use server';

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// ============================================================================
// NEW FAMILY-ORGANIZED PROVIDER TYPES
// ============================================================================

export type IntegrationProvider = 
  // Meta Family (Facebook/Instagram/WhatsApp/Meta Pixel)
  | 'meta-app'              // Shared app credentials: appId, appSecret
  | 'facebook-page'         // Facebook Page: pageId, accessToken, verifyToken, manualPageId, manualPageToken
  | 'instagram-page'        // Instagram Page: pageId, accessToken
  | 'whatsapp'             // WhatsApp Business: phoneNumberId, wabaId, accessToken
  | 'meta-pixel'           // Meta Pixel: pixelId, capiToken
  
  // TikTok Family
  | 'tiktok-ads'            // TikTok Ads: tiktokPixelId, tiktokAccessToken
  | 'tiktok-messages'       // TikTok Messages/Webhooks: tiktokAppId, tiktokClientSecret, tiktokWebhookSecret
  
  // LinkedIn Family
  | 'linkedin-ads'         // LinkedIn Ads: linkedinPartnerId, linkedinConversionId, linkedinAccessToken
  | 'linkedin-webhook'      // LinkedIn Webhooks: linkedinClientId, linkedinClientSecret, linkedinWebhookSecret
  
  // Other Platforms (unchanged)
  | 'google-analytics'
  | 'google-tag-manager'
  | 'google-search-console'
  | 'google-ads'
  | 'hotjar'
  | 'ahrefs'
  | 'gemini'
  | 'ai-models';

// ============================================================================
// FAMILY CONFIG INTERFACES
// ============================================================================

// Meta Family - Shared App (common for all Meta products)
export interface MetaAppConfig {
  appId?: string;
  appSecret?: string;
}

// Meta Family - Facebook Page
export interface FacebookPageConfig {
  pageId?: string;
  accessToken?: string;
  verifyToken?: string;
  manualPageId?: string;
  manualPageToken?: string;
}

// Meta Family - Instagram Page  
export interface InstagramPageConfig {
  pageId?: string;
  accessToken?: string;
}

// Meta Family - WhatsApp
export interface WhatsAppConfig {
  phoneNumberId?: string;
  wabaId?: string;
  accessToken?: string;
}

// Meta Family - Pixel
export interface MetaPixelConfig {
  pixelId?: string;
  capiToken?: string;
}

// TikTok Family - Ads
export interface TikTokAdsConfig {
  tiktokPixelId?: string;
  tiktokAccessToken?: string;
}

// TikTok Family - Messages/Webhooks
export interface TikTokMessagesConfig {
  tiktokAppId?: string;
  tiktokClientSecret?: string;
  tiktokWebhookSecret?: string;
}

// LinkedIn Family - Ads
export interface LinkedInAdsConfig {
  linkedinPartnerId?: string;
  linkedinConversionId?: string;
  linkedinAccessToken?: string;
}

// LinkedIn Family - Webhook
export interface LinkedInWebhookConfig {
  linkedinClientId?: string;
  linkedinClientSecret?: string;
  linkedinWebhookSecret?: string;
}

// Google Config
export interface GoogleAnalyticsConfig {
  measurementId?: string;
  propertyId?: string;
  apiSecret?: string;
  clientEmail?: string;
  privateKey?: string;
}

// Google Search Console
export interface GoogleSearchConsoleConfig {
  clientId?: string;
  clientSecret?: string;
  refreshToken?: string;
}

// Google GTM
export interface GoogleTagManagerConfig {
  containerId?: string;
}

// Google Ads
export interface GoogleAdsConfig {
  googleAdsId?: string;
  googleAdsDeveloperToken?: string;
  googleAdsManagerId?: string;
  googleAdsCustomerId?: string;
  googleAdsConversionActionId?: string;
  googleAdsAccessToken?: string;
  googleWebhookKey?: string;
}

// Hotjar
export interface HotjarConfig {
  siteId?: string;
}

// Ahrefs Web Analytics
export interface AhrefsConfig {
  dataKey?: string;
}

// AI Models
export interface AiModelsConfig {
  openAiApiKey?: string;
  anthropicApiKey?: string;
  geminiApiKey?: string;
  deepseekApiKey?: string;
  mistralApiKey?: string;
  xaiApiKey?: string;
}

// Unified Config Type
export type IntegrationConfigData = Partial<
  MetaAppConfig &
  FacebookPageConfig &
  InstagramPageConfig &
  WhatsAppConfig &
  MetaPixelConfig &
  TikTokAdsConfig &
  TikTokMessagesConfig &
  LinkedInAdsConfig &
  LinkedInWebhookConfig &
  GoogleAnalyticsConfig &
  GoogleSearchConsoleConfig &
  GoogleTagManagerConfig &
  GoogleAdsConfig &
  HotjarConfig &
  AhrefsConfig &
  AiModelsConfig
>;

// ============================================================================
// BACKWARDS COMPATIBILITY - Map old providers to new
// ============================================================================

const PROVIDER_MIGRATION_MAP: Record<string, string> = {
  // Legacy facebook -> split into meta-app + facebook-page
  'facebook': 'facebook-page',
  'instagram': 'instagram-page',
  'whatsapp': 'whatsapp',
  'facebook-pixel': 'meta-pixel',
  
  // Legacy TikTok -> tiktok-ads or tiktok-messages
  'tiktok-pixel': 'tiktok-ads',
  'tiktok-messages': 'tiktok-messages',
  
  // Legacy LinkedIn -> linkedin-ads or linkedin-webhook
  'linkedin-insight': 'linkedin-ads',
  'linkedin-webhook': 'linkedin-webhook',
  
  'google-analytics': 'google-analytics',
  'google-tag-manager': 'google-tag-manager',
  'google-search-console': 'google-search-console',
  'google-ads': 'google-ads',
  'hotjar': 'hotjar',
  'ahrefs': 'ahrefs',
  'gemini': 'ai-models',
  'ai-models': 'ai-models',
};

// ============================================================================
// MIGRATION LOGIC
// ============================================================================

async function migrateLegacyConfig(companyId: string, oldProvider: string, oldData: any): Promise<void> {
  console.log(`[Migration] Checking legacy provider: ${oldProvider}`);
  
  if (!oldData || Object.keys(oldData).length === 0) return;
  
  // Migration from 'facebook' (old single config) to new family structure
  if (oldProvider === 'facebook' && (oldData.appId || oldData.appSecret)) {
    // 1. Save app credentials in meta-app
    await prisma.integrationConfig.upsert({
      where: { companyId_provider: { companyId, provider: 'meta-app' } },
      update: { config: { appId: oldData.appId, appSecret: oldData.appSecret } },
      create: { companyId, provider: 'meta-app', config: { appId: oldData.appId, appSecret: oldData.appSecret } }
    });
    console.log('[Migration] Saved app credentials to meta-app');
    
    // 2. Save page config in facebook-page
    await prisma.integrationConfig.upsert({
      where: { companyId_provider: { companyId, provider: 'facebook-page' } },
      update: { config: { 
        pageId: oldData.pageId, 
        accessToken: oldData.accessToken,
        verifyToken: oldData.verifyToken,
        manualPageId: oldData.manualPageId,
        manualPageToken: oldData.manualPageToken
      }},
      create: { companyId, provider: 'facebook-page', config: { 
        pageId: oldData.pageId, 
        accessToken: oldData.accessToken,
        verifyToken: oldData.verifyToken,
        manualPageId: oldData.manualPageId,
        manualPageToken: oldData.manualPageToken
      }}
    });
    console.log('[Migration] Saved page config to facebook-page');
  }
  
  // Migration from 'facebook-pixel' to 'meta-pixel'
  if (oldProvider === 'facebook-pixel' && (oldData.pixelId || oldData.capiToken)) {
    await prisma.integrationConfig.upsert({
      where: { companyId_provider: { companyId, provider: 'meta-pixel' } },
      update: { config: { pixelId: oldData.pixelId, capiToken: oldData.capiToken } },
      create: { companyId, provider: 'meta-pixel', config: { pixelId: oldData.pixelId, capiToken: oldData.capiToken } }
    });
    console.log('[Migration] Saved pixel config to meta-pixel');
  }
  
  // Migration from 'whatsapp' stays as 'whatsapp' (same name)
  if (oldProvider === 'whatsapp' && (oldData.phoneNumberId || oldData.accessToken)) {
    await prisma.integrationConfig.upsert({
      where: { companyId_provider: { companyId, provider: 'whatsapp' } },
      update: { config: { phoneNumberId: oldData.phoneNumberId, wabaId: oldData.wabaId, accessToken: oldData.accessToken } },
      create: { companyId, provider: 'whatsapp', config: { phoneNumberId: oldData.phoneNumberId, wabaId: oldData.wabaId, accessToken: oldData.accessToken } }
    });
    console.log('[Migration] Saved WhatsApp config');
  }
  
  // Migration from 'tiktok-pixel' to 'tiktok-ads'
  if (oldProvider === 'tiktok-pixel' && (oldData.tiktokPixelId || oldData.tiktokAccessToken)) {
    await prisma.integrationConfig.upsert({
      where: { companyId_provider: { companyId, provider: 'tiktok-ads' } },
      update: { config: { tiktokPixelId: oldData.tiktokPixelId, tiktokAccessToken: oldData.tiktokAccessToken } },
      create: { companyId, provider: 'tiktok-ads', config: { tiktokPixelId: oldData.tiktokPixelId, tiktokAccessToken: oldData.tiktokAccessToken } }
    });
    console.log('[Migration] Saved TikTok Ads config');
  }
  
  // Migration from 'tiktok-messages' stays as 'tiktok-messages'
  if (oldProvider === 'tiktok-messages' && (oldData.tiktokAppId || oldData.tiktokClientSecret)) {
    await prisma.integrationConfig.upsert({
      where: { companyId_provider: { companyId, provider: 'tiktok-messages' } },
      update: { config: { tiktokAppId: oldData.tiktokAppId, tiktokClientSecret: oldData.tiktokClientSecret, tiktokWebhookSecret: oldData.tiktokWebhookSecret } },
      create: { companyId, provider: 'tiktok-messages', config: { tiktokAppId: oldData.tiktokAppId, tiktokClientSecret: oldData.tiktokClientSecret, tiktokWebhookSecret: oldData.tiktokWebhookSecret } }
    });
    console.log('[Migration] Saved TikTok Messages config');
  }
  
  // Migration from 'linkedin-insight' to 'linkedin-ads'
  if (oldProvider === 'linkedin-insight' && (oldData.linkedinPartnerId || oldData.linkedinAccessToken)) {
    await prisma.integrationConfig.upsert({
      where: { companyId_provider: { companyId, provider: 'linkedin-ads' } },
      update: { config: { linkedinPartnerId: oldData.linkedinPartnerId, linkedinConversionId: oldData.linkedinConversionId, linkedinAccessToken: oldData.linkedinAccessToken } },
      create: { companyId, provider: 'linkedin-ads', config: { linkedinPartnerId: oldData.linkedinPartnerId, linkedinConversionId: oldData.linkedinConversionId, linkedinAccessToken: oldData.linkedinAccessToken } }
    });
    console.log('[Migration] Saved LinkedIn Ads config');
  }
  
  // Migration from 'linkedin-webhook' stays as 'linkedin-webhook'
  if (oldProvider === 'linkedin-webhook' && (oldData.linkedinClientId || oldData.linkedinClientSecret)) {
    await prisma.integrationConfig.upsert({
      where: { companyId_provider: { companyId, provider: 'linkedin-webhook' } },
      update: { config: { linkedinClientId: oldData.linkedinClientId, linkedinClientSecret: oldData.linkedinClientSecret, linkedinWebhookSecret: oldData.linkedinWebhookSecret } },
      create: { companyId, provider: 'linkedin-webhook', config: { linkedinClientId: oldData.linkedinClientId, linkedinClientSecret: oldData.linkedinClientSecret, linkedinWebhookSecret: oldData.linkedinWebhookSecret } }
    });
    console.log('[Migration] Saved LinkedIn Webhook config');
  }
}

// ============================================================================
// HELPER FUNCTIONS & PROXIES
// ============================================================================

const API_GATEWAY_URL = process.env.API_GATEWAY_URL || 'http://localhost:8080';

// Get shared Meta app credentials
export async function getMetaAppConfig(companyId: string): Promise<MetaAppConfig | null> {
  try {
    const response = await fetch(`${API_GATEWAY_URL}/api/integrations/config?companyId=${companyId}&provider=meta-app`, {
      cache: 'no-store'
    });
    if (!response.ok) return null;
    return await response.json() as MetaAppConfig;
  } catch {
    return null;
  }
}

// Get Facebook page config
export async function getFacebookPageConfig(companyId: string): Promise<FacebookPageConfig | null> {
  try {
    const response = await fetch(`${API_GATEWAY_URL}/api/integrations/config?companyId=${companyId}&provider=facebook-page`, {
      cache: 'no-store'
    });
    if (!response.ok) return null;
    return await response.json() as FacebookPageConfig;
  } catch {
    return null;
  }
}

// Get WhatsApp config
export async function getWhatsAppConfig(companyId: string): Promise<WhatsAppConfig | null> {
  try {
    const response = await fetch(`${API_GATEWAY_URL}/api/integrations/config?companyId=${companyId}&provider=whatsapp`, {
      cache: 'no-store'
    });
    if (!response.ok) return null;
    return await response.json() as WhatsAppConfig;
  } catch {
    return null;
  }
}

// ============================================================================
// MAIN FUNCTIONS
// ============================================================================

export async function getIntegrationConfig(provider: IntegrationProvider): Promise<IntegrationConfigData | null> {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      console.log(`[IntegrationConfig] No session for getIntegrationConfig(${provider})`);
      return null;
    }

    const response = await fetch(`${API_GATEWAY_URL}/api/integrations/config?userId=${session.user.id}&provider=${provider}`, {
      cache: 'no-store'
    });
    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data as unknown as IntegrationConfigData;
  } catch (error: any) {
    console.error(`[IntegrationConfig] Error in getIntegrationConfig(${provider}):`, error);
    return null;
  }
}

export async function updateIntegrationConfig(provider: IntegrationProvider, data: IntegrationConfigData) {
  console.log(`[IntegrationConfig] Updating config for ${provider}...`);
  try {
    const session = await auth();
    if (!session?.user?.email || !session?.user?.id) {
      console.error("[IntegrationConfig] No session or user email/id found.");
      return { success: false, error: "Unauthorized" };
    }

    console.log(`[IntegrationConfig] User ID: ${session.user.id}, provider: ${provider}`);

    const response = await fetch(`${API_GATEWAY_URL}/api/integrations/config`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userId: session.user.id,
        companyId: session.user.companyId,
        provider,
        config: data
      })
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      return { success: false, error: err.error || "Failed to save configuration" };
    }

    revalidatePath('/dashboard/settings/integrations');
    return { success: true };
  } catch (error) {
    console.error("[IntegrationConfig] Error updating config:", error);
    return { success: false, error: "Failed to save configuration" };
  }
}

// Legacy helper - get app credentials from meta-app or fallback to old location
export async function getIntegrationAppConfig(provider: IntegrationProvider): Promise<{appId?: string; appSecret?: string} | null> {
  const session = await auth();
  if (!session?.user?.email) return null;
  
  try {
    const response = await fetch(`${API_GATEWAY_URL}/api/integrations/config?userId=${session.user.id}&provider=meta-app`, {
      cache: 'no-store'
    });
    if (response.ok) {
      const metaApp = await response.json();
      if (metaApp?.appId && metaApp?.appSecret) {
        return { appId: metaApp.appId, appSecret: metaApp.appSecret };
      }
    }
  } catch (error) {
    console.error("[getIntegrationAppConfig] Error fetching meta-app config:", error);
  }

  // Fallback to legacy facebook config
  try {
    const response = await fetch(`${API_GATEWAY_URL}/api/integrations/config?userId=${session.user.id}&provider=facebook`, {
      cache: 'no-store'
    });
    if (response.ok) {
      const legacy = await response.json();
      if (legacy) return legacy;
    }
  } catch (error) {
    console.error("[getIntegrationAppConfig] Error fetching legacy facebook config:", error);
  }

  return null;
}