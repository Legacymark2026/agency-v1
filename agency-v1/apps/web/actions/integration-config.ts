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
  | 'ai-models'
  | 'manychat';

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

// ManyChat
export interface ManyChatConfig {
  apiToken?: string;
  pageId?: string;
  webhookSecret?: string;
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
  AiModelsConfig &
  ManyChatConfig
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
    if (!session?.user?.email || !session?.user?.id) {
      console.log(`[IntegrationConfig] No session for getIntegrationConfig(${provider})`);
      return null;
    }

    try {
      const response = await fetch(`${API_GATEWAY_URL}/api/integrations/config?userId=${session.user.id}&provider=${provider}`, {
        cache: 'no-store'
      });
      if (response.ok) {
        const data = await response.json();
        return data as unknown as IntegrationConfigData;
      }
    } catch {
      // API Gateway not available, fallback to Prisma directly
    }

    const companyUser = await prisma.companyUser.findFirst({
      where: { userId: session.user.id },
      select: { companyId: true }
    });
    const companyId = companyUser?.companyId || (session.user as any).companyId;

    if (companyId) {
      const conf = await prisma.integrationConfig.findUnique({
        where: { companyId_provider: { companyId, provider } }
      });
      if (conf?.config) {
        return conf.config as unknown as IntegrationConfigData;
      }
    }

    return null;
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

    const companyUser = await prisma.companyUser.findFirst({
      where: { userId: session.user.id },
      select: { companyId: true }
    });
    const targetCompanyId = companyUser?.companyId || (session.user as any).companyId;

    if (targetCompanyId) {
      await prisma.integrationConfig.upsert({
        where: { companyId_provider: { companyId: targetCompanyId, provider } },
        update: { config: data, isEnabled: true },
        create: { companyId: targetCompanyId, provider, config: data, isEnabled: true }
      });
    }

    try {
      await fetch(`${API_GATEWAY_URL}/api/integrations/config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: session.user.id,
          companyId: targetCompanyId,
          provider,
          config: data
        })
      });
    } catch {
      // Gateway error is ok because DB is already updated
    }

    revalidatePath('/dashboard/settings/integrations');
    revalidatePath('/dashboard/admin/marketing/settings');
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

// ============================================================================
// REAL INTEGRATION VERIFICATION — pings external APIs with stored credentials
// ============================================================================

export interface VerifyResult {
  ok: boolean;
  latencyMs: number;
  status?: number;
  message: string;
  detail?: string;      // Raw API error message
  checkedAt: string;
}

/**
 * Verifies an integration by making a real authenticated call to the provider's API.
 * Uses credentials stored in the DB — never simulates or mocks the result.
 */
export async function verifyIntegrationConnection(provider: string): Promise<VerifyResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false, latencyMs: 0, message: 'No autenticado', checkedAt: new Date().toISOString() };
  }

  // Load config from DB
  let config: Record<string, any> = {};
  try {
    const res = await fetch(
      `${API_GATEWAY_URL}/api/integrations/config?userId=${session.user.id}&provider=${provider}`,
      { cache: 'no-store' }
    );
    if (res.ok) {
      const data = await res.json();
      if (data && typeof data === 'object') config = data;
    }
  } catch {
    // config stays empty — will return UNCONFIGURED
  }

  const start = Date.now();

  const makeResult = (ok: boolean, message: string, detail?: string, status?: number): VerifyResult => ({
    ok,
    latencyMs: Date.now() - start,
    status,
    message,
    detail,
    checkedAt: new Date().toISOString(),
  });

  // ── ManyChat ─────────────────────────────────────────────────────────────
  if (provider === 'manychat') {
    const { apiToken } = config;
    if (!apiToken) {
      return makeResult(false, 'Falta configurar el ManyChat API Token (Bearer)');
    }
    try {
      const r = await fetch('https://api.manychat.com/fb/page/getInfo', {
        headers: {
          'Authorization': `Bearer ${apiToken}`,
          'Accept': 'application/json'
        },
        signal: AbortSignal.timeout(8000)
      });
      const data = await r.json();
      if (r.ok && data.status === 'success') {
        return makeResult(true, `ManyChat verificado: ${data.data?.name || 'Página conectada'}`, undefined, r.status);
      }
      return makeResult(false, 'Error de autenticación con ManyChat API', data?.message || `HTTP ${r.status}`, r.status);
    } catch (e: any) {
      return makeResult(false, 'No se pudo conectar con ManyChat API', e.message);
    }
  }

  // ── Meta Pixel (facebook-pixel / meta-pixel) ─────────────────────────────
  if (provider === 'meta-pixel' || provider === 'facebook-pixel') {
    const { pixelId, capiToken } = config;
    if (!pixelId || !capiToken) {
      return makeResult(false, 'Faltan credenciales: Pixel ID y CAPI Token son requeridos');
    }
    try {
      const r = await fetch(
        `https://graph.facebook.com/v20.0/${pixelId}?access_token=${capiToken}&fields=id,name`,
        { signal: AbortSignal.timeout(8000) }
      );
      const data = await r.json();
      if (r.ok && data.id) {
        return makeResult(true, `Pixel verificado: ${data.name || data.id}`, undefined, r.status);
      }
      const errMsg = data?.error?.message || `HTTP ${r.status}`;
      const errCode = data?.error?.code ? ` (#${data.error.code})` : '';
      return makeResult(false, 'Error de autenticación con Meta', `${errMsg}${errCode}`, r.status);
    } catch (e: any) {
      return makeResult(false, 'No se pudo conectar con Meta Graph API', e.message);
    }
  }

  // ── Facebook Page (facebook-page) ─────────────────────────────────────────
  if (provider === 'facebook-page' || provider === 'facebook') {
    // Try page-specific token first, then generic
    const accessToken = config.accessToken || config.manualPageToken;
    const pageId = config.pageId || config.manualPageId;
    if (!accessToken) {
      return makeResult(false, 'Falta el Page Access Token');
    }
    try {
      const endpoint = pageId
        ? `https://graph.facebook.com/v20.0/${pageId}?access_token=${accessToken}&fields=id,name,fan_count`
        : `https://graph.facebook.com/v20.0/me?access_token=${accessToken}&fields=id,name`;
      const r = await fetch(endpoint, { signal: AbortSignal.timeout(8000) });
      const data = await r.json();
      if (r.ok && data.id) {
        const fans = data.fan_count ? ` · ${data.fan_count.toLocaleString()} seguidores` : '';
        return makeResult(true, `Página conectada: ${data.name}${fans}`, undefined, r.status);
      }
      const errMsg = data?.error?.message || `HTTP ${r.status}`;
      const errCode = data?.error?.code ? ` (#${data.error.code})` : '';
      return makeResult(false, 'Token inválido o expirado', `${errMsg}${errCode}`, r.status);
    } catch (e: any) {
      return makeResult(false, 'No se pudo conectar con Meta Graph API', e.message);
    }
  }

  // ── WhatsApp Business ─────────────────────────────────────────────────────
  if (provider === 'whatsapp') {
    const { phoneNumberId, accessToken } = config;
    if (!phoneNumberId || !accessToken) {
      return makeResult(false, 'Faltan credenciales: Phone Number ID y Access Token son requeridos');
    }
    try {
      const r = await fetch(
        `https://graph.facebook.com/v20.0/${phoneNumberId}?access_token=${accessToken}&fields=id,display_phone_number,verified_name,quality_rating`,
        { signal: AbortSignal.timeout(8000) }
      );
      const data = await r.json();
      if (r.ok && data.id) {
        const quality = data.quality_rating ? ` · Calidad: ${data.quality_rating}` : '';
        return makeResult(
          true,
          `WhatsApp conectado: ${data.display_phone_number || data.id} (${data.verified_name || 'verificado'}${quality})`,
          undefined, r.status
        );
      }
      const errMsg = data?.error?.message || `HTTP ${r.status}`;
      return makeResult(false, 'Token de WhatsApp inválido o expirado', errMsg, r.status);
    } catch (e: any) {
      return makeResult(false, 'No se pudo conectar con WhatsApp Cloud API', e.message);
    }
  }

  // ── TikTok Ads / Pixel ────────────────────────────────────────────────────
  if (provider === 'tiktok-ads' || provider === 'tiktok-pixel') {
    const { tiktokAccessToken } = config;
    if (!tiktokAccessToken) {
      return makeResult(false, 'Falta el Access Token de TikTok Ads');
    }
    try {
      const r = await fetch('https://business-api.tiktok.com/open_api/v1.3/user/info/', {
        headers: { 'Access-Token': tiktokAccessToken },
        signal: AbortSignal.timeout(8000),
      });
      const data = await r.json();
      if (r.ok && data?.data?.display_name) {
        return makeResult(true, `TikTok Ads conectado: ${data.data.display_name}`, undefined, r.status);
      }
      const errMsg = data?.message || data?.error?.description || `HTTP ${r.status}`;
      return makeResult(false, 'Token de TikTok inválido', errMsg, r.status);
    } catch (e: any) {
      return makeResult(false, 'No se pudo conectar con TikTok Business API', e.message);
    }
  }

  // ── LinkedIn Ads ──────────────────────────────────────────────────────────
  if (provider === 'linkedin-ads' || provider === 'linkedin-insight') {
    const { linkedinAccessToken } = config;
    if (!linkedinAccessToken) {
      return makeResult(false, 'Falta el Access Token de LinkedIn');
    }
    try {
      const r = await fetch('https://api.linkedin.com/v2/userinfo', {
        headers: { Authorization: `Bearer ${linkedinAccessToken}` },
        signal: AbortSignal.timeout(8000),
      });
      const data = await r.json();
      if (r.ok && (data.sub || data.name)) {
        return makeResult(true, `LinkedIn conectado: ${data.name || data.sub}`, undefined, r.status);
      }
      const errMsg = data?.message || data?.error_description || `HTTP ${r.status}`;
      return makeResult(false, 'Token de LinkedIn inválido o expirado', errMsg, r.status);
    } catch (e: any) {
      return makeResult(false, 'No se pudo conectar con LinkedIn API', e.message);
    }
  }

  // ── Google Analytics 4 ────────────────────────────────────────────────────
  if (provider === 'google-analytics') {
    const { measurementId, apiSecret, propertyId } = config;
    if (!measurementId) {
      return makeResult(false, 'Falta el Measurement ID (formato: G-XXXXXXXX)');
    }
    // Validate format
    if (!/^G-[A-Z0-9]{4,}$/i.test(measurementId)) {
      return makeResult(false, `Measurement ID inválido: "${measurementId}". Debe tener formato G-XXXXXXXX`);
    }
    if (!apiSecret) {
      // ID válido pero sin API Secret — no podemos verificar autenticación
      return makeResult(true, `Measurement ID configurado: ${measurementId} (para verificación completa, configura el API Secret)`, 'Sin API Secret: solo el ID está guardado, no se verifica la autenticación del Measurement Protocol');
    }
    // Send a debug test hit to Measurement Protocol
    try {
      const pid = propertyId || measurementId.replace('G-', '');
      const r = await fetch(
        `https://www.google-analytics.com/debug/mp/collect?measurement_id=${measurementId}&api_secret=${apiSecret}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ client_id: 'verify-test', events: [{ name: 'verify_connection' }] }),
          signal: AbortSignal.timeout(8000),
        }
      );
      const data = await r.json();
      const validationMessages = data?.validationMessages || [];
      if (r.ok && validationMessages.length === 0) {
        return makeResult(true, `Google Analytics 4 verificado: ${measurementId}`, undefined, r.status);
      }
      if (validationMessages.length > 0) {
        const msgs = validationMessages.map((m: any) => m.description).join('; ');
        // Validation issues but connectivity is fine
        return makeResult(true, `GA4 conectado con advertencias: ${measurementId}`, msgs, r.status);
      }
      return makeResult(false, 'Error de validación en GA4 Measurement Protocol', JSON.stringify(data).slice(0, 200), r.status);
    } catch (e: any) {
      return makeResult(false, 'No se pudo conectar con Google Analytics API', e.message);
    }
  }

  // ── Google Ads ────────────────────────────────────────────────────────────
  if (provider === 'google-ads') {
    const { googleAdsDeveloperToken, googleAdsId } = config;
    if (!googleAdsDeveloperToken || !googleAdsId) {
      return makeResult(false, 'Faltan credenciales: Google Ads ID y Developer Token son requeridos');
    }
    try {
      const r = await fetch(
        `https://googleads.googleapis.com/v17/customers/${googleAdsId.replace(/-/g, '')}`,
        {
          headers: {
            'developer-token': googleAdsDeveloperToken,
            'Content-Type': 'application/json',
          },
          signal: AbortSignal.timeout(8000),
        }
      );
      // 401 = bad developer token, 403 = token valid but no access, 404 = customer not found but token is real
      if (r.status === 200 || r.status === 403 || r.status === 404) {
        const data = await r.json().catch(() => ({}));
        if (r.status === 200) {
          return makeResult(true, `Google Ads conectado: Customer ${googleAdsId}`, undefined, r.status);
        }
        // 403/404 = token recognized but access issue — still "partially configured"
        const errMsg = data?.error?.message || `HTTP ${r.status}`;
        return makeResult(false, 'Developer Token válido pero sin acceso al Customer ID', errMsg, r.status);
      }
      const data = await r.json().catch(() => ({}));
      const errMsg = data?.error?.message || `HTTP ${r.status}`;
      return makeResult(false, 'Developer Token de Google Ads inválido', errMsg, r.status);
    } catch (e: any) {
      return makeResult(false, 'No se pudo conectar con Google Ads API', e.message);
    }
  }

  // ── Google Tag Manager ────────────────────────────────────────────────────
  if (provider === 'google-tag-manager') {
    const { containerId } = config;
    if (!containerId) {
      return makeResult(false, 'Falta el Container ID (formato: GTM-XXXXXXX)');
    }
    if (!/^GTM-[A-Z0-9]{4,}$/i.test(containerId)) {
      return makeResult(false, `Container ID inválido: "${containerId}". Debe tener formato GTM-XXXXXXX`);
    }
    // GTM doesn't have a public verification API without OAuth — validate format and reachability
    try {
      const r = await fetch(
        `https://www.googletagmanager.com/gtm.js?id=${containerId}`,
        { method: 'HEAD', signal: AbortSignal.timeout(8000) }
      );
      if (r.ok) {
        return makeResult(true, `GTM Container configurado: ${containerId}`, undefined, r.status);
      }
      return makeResult(false, `Container ID no encontrado en Google: ${containerId}`, `HTTP ${r.status}`, r.status);
    } catch (e: any) {
      return makeResult(false, 'No se pudo verificar el Container ID de GTM', e.message);
    }
  }

  // ── Google Search Console ─────────────────────────────────────────────────
  if (provider === 'google-search-console') {
    const { clientId, refreshToken } = config;
    if (!clientId || !refreshToken) {
      return makeResult(false, 'Faltan credenciales: Client ID y Refresh Token son requeridos');
    }
    // Verify refresh token against Google token introspection
    try {
      const r = await fetch(`https://oauth2.googleapis.com/tokeninfo?refresh_token=${refreshToken}`, {
        signal: AbortSignal.timeout(8000),
      });
      const data = await r.json();
      if (r.ok && data.aud) {
        return makeResult(true, `Google Search Console autorizado para: ${data.email || data.aud}`, undefined, r.status);
      }
      const errMsg = data?.error_description || data?.error || `HTTP ${r.status}`;
      return makeResult(false, 'Refresh Token de Google inválido o revocado', errMsg, r.status);
    } catch (e: any) {
      return makeResult(false, 'No se pudo verificar el token con Google OAuth2', e.message);
    }
  }

  // ── Hotjar ────────────────────────────────────────────────────────────────
  if (provider === 'hotjar') {
    const { siteId } = config;
    if (!siteId) {
      return makeResult(false, 'Falta el Site ID de Hotjar');
    }
    if (!/^\d+$/.test(String(siteId))) {
      return makeResult(false, `Site ID inválido: "${siteId}". Debe ser un número (ej: 3742891)`);
    }
    // Hotjar doesn't have a public REST API — verify the tracking script loads
    try {
      const r = await fetch(`https://static.hotjar.com/c/hotjar-${siteId}.js`, {
        method: 'HEAD',
        signal: AbortSignal.timeout(8000),
      });
      if (r.ok) {
        return makeResult(true, `Hotjar Site ID verificado: ${siteId}`, undefined, r.status);
      }
      return makeResult(false, `Site ID ${siteId} no encontrado en Hotjar`, `HTTP ${r.status}`, r.status);
    } catch (e: any) {
      return makeResult(false, 'No se pudo verificar el Site ID de Hotjar', e.message);
    }
  }

  // ── Ahrefs ────────────────────────────────────────────────────────────────
  if (provider === 'ahrefs') {
    const { dataKey } = config;
    if (!dataKey) {
      return makeResult(false, 'Falta el Data Key de Ahrefs Web Analytics');
    }
    try {
      const r = await fetch('https://api.ahrefs.com/v3/subscription/info', {
        headers: { Authorization: `Bearer ${dataKey}` },
        signal: AbortSignal.timeout(8000),
      });
      const data = await r.json();
      if (r.ok && data?.subscription) {
        return makeResult(true, `Ahrefs conectado: Plan ${data.subscription.plan || 'activo'}`, undefined, r.status);
      }
      // 401 on Ahrefs Analytics Web keys (analytics key != API key)
      if (r.status === 401) {
        // The web analytics data key is different from the REST API key
        // We can verify the script loads instead
        const scriptR = await fetch(`https://analytics.ahrefs.com/analytics.js`, {
          method: 'HEAD', signal: AbortSignal.timeout(5000)
        });
        if (scriptR.ok) {
          return makeResult(true, `Ahrefs Data Key configurado: ${dataKey.slice(0, 12)}... (script de analytics verificado)`, 'El Data Key de Web Analytics no tiene acceso a la API REST de Ahrefs, lo cual es normal');
        }
      }
      const errMsg = data?.message || data?.error || `HTTP ${r.status}`;
      return makeResult(false, 'Data Key de Ahrefs inválido', errMsg, r.status);
    } catch (e: any) {
      return makeResult(false, 'No se pudo conectar con Ahrefs API', e.message);
    }
  }

  // ── AI Models ────────────────────────────────────────────────────────────
  if (provider === 'ai-models' || provider === 'gemini') {
    const { openAiApiKey, geminiApiKey, anthropicApiKey, deepseekApiKey, mistralApiKey, xaiApiKey } = config;

    // Try each key in priority order
    if (openAiApiKey) {
      try {
        const r = await fetch('https://api.openai.com/v1/models', {
          headers: { Authorization: `Bearer ${openAiApiKey}` },
          signal: AbortSignal.timeout(8000),
        });
        const data = await r.json();
        if (r.ok && data.data) {
          const modelCount = data.data.length;
          return makeResult(true, `OpenAI conectado · ${modelCount} modelos disponibles`, undefined, r.status);
        }
        const errMsg = data?.error?.message || `HTTP ${r.status}`;
        return makeResult(false, 'API Key de OpenAI inválida', errMsg, r.status);
      } catch (e: any) {
        return makeResult(false, 'No se pudo conectar con OpenAI API', e.message);
      }
    }

    if (geminiApiKey) {
      try {
        const r = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models?key=${geminiApiKey}`,
          { signal: AbortSignal.timeout(8000) }
        );
        const data = await r.json();
        if (r.ok && data.models) {
          const modelCount = data.models.length;
          return makeResult(true, `Google Gemini conectado · ${modelCount} modelos disponibles`, undefined, r.status);
        }
        const errMsg = data?.error?.message || `HTTP ${r.status}`;
        return makeResult(false, 'API Key de Gemini inválida', errMsg, r.status);
      } catch (e: any) {
        return makeResult(false, 'No se pudo conectar con Google Gemini API', e.message);
      }
    }

    if (anthropicApiKey) {
      try {
        const r = await fetch('https://api.anthropic.com/v1/models', {
          headers: { 'x-api-key': anthropicApiKey, 'anthropic-version': '2023-06-01' },
          signal: AbortSignal.timeout(8000),
        });
        const data = await r.json();
        if (r.ok) {
          return makeResult(true, `Anthropic Claude conectado · modelos disponibles`, undefined, r.status);
        }
        const errMsg = data?.error?.message || `HTTP ${r.status}`;
        return makeResult(false, 'API Key de Anthropic inválida', errMsg, r.status);
      } catch (e: any) {
        return makeResult(false, 'No se pudo conectar con Anthropic API', e.message);
      }
    }

    if (deepseekApiKey) {
      try {
        const r = await fetch('https://api.deepseek.com/models', {
          headers: { Authorization: `Bearer ${deepseekApiKey}` },
          signal: AbortSignal.timeout(8000),
        });
        const data = await r.json();
        if (r.ok) {
          return makeResult(true, `DeepSeek conectado`, undefined, r.status);
        }
        const errMsg = data?.error?.message || `HTTP ${r.status}`;
        return makeResult(false, 'API Key de DeepSeek inválida', errMsg, r.status);
      } catch (e: any) {
        return makeResult(false, 'No se pudo conectar con DeepSeek API', e.message);
      }
    }

    if (mistralApiKey) {
      try {
        const r = await fetch('https://api.mistral.ai/v1/models', {
          headers: { Authorization: `Bearer ${mistralApiKey}` },
          signal: AbortSignal.timeout(8000),
        });
        if (r.ok) {
          return makeResult(true, `Mistral AI conectado`, undefined, r.status);
        }
        return makeResult(false, 'API Key de Mistral inválida', `HTTP ${r.status}`, r.status);
      } catch (e: any) {
        return makeResult(false, 'No se pudo conectar con Mistral API', e.message);
      }
    }

    if (xaiApiKey) {
      try {
        const r = await fetch('https://api.x.ai/v1/models', {
          headers: { Authorization: `Bearer ${xaiApiKey}` },
          signal: AbortSignal.timeout(8000),
        });
        if (r.ok) {
          return makeResult(true, `xAI (Grok) conectado`, undefined, r.status);
        }
        return makeResult(false, 'API Key de xAI inválida', `HTTP ${r.status}`, r.status);
      } catch (e: any) {
        return makeResult(false, 'No se pudo conectar con xAI API', e.message);
      }
    }

    return makeResult(false, 'No hay ninguna API Key de IA configurada');
  }

  // ── PayU ─────────────────────────────────────────────────────────────────
  if (provider === 'payu') {
    const { apiKey, merchantId, accountId } = config;
    if (!apiKey || !merchantId) {
      return makeResult(false, 'Faltan credenciales: API Key y Merchant ID son requeridos');
    }
    // PayU ping endpoint
    try {
      const r = await fetch('https://api.payulatam.com/payments-api/4.0/service.cgi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          language: 'es',
          command: 'PING',
          merchant: { apiLogin: 'pRRXKOl8ikMmt9u', apiKey: apiKey },
          test: false,
        }),
        signal: AbortSignal.timeout(8000),
      });
      const data = await r.json();
      if (r.ok && data.code === 'SUCCESS') {
        return makeResult(true, `PayU API conectada · Merchant ${merchantId}`, undefined, r.status);
      }
      const errMsg = data?.error || data?.description || `HTTP ${r.status}`;
      return makeResult(false, 'Credenciales de PayU inválidas', errMsg, r.status);
    } catch (e: any) {
      return makeResult(false, 'No se pudo conectar con PayU API', e.message);
    }
  }

  // ── Fallback: provider not handled ───────────────────────────────────────
  const hasAnyConfig = Object.keys(config).length > 0;
  if (!hasAnyConfig) {
    return makeResult(false, `Integración "${provider}" sin credenciales configuradas`);
  }
  return makeResult(true, `Integración "${provider}" configurada (verificación automática no disponible para este proveedor)`);
}