'use server';

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export type IntegrationProvider = 'facebook' | 'whatsapp' | 'instagram' | 'google-analytics' | 'google-tag-manager' | 'facebook-pixel' | 'hotjar' | 'tiktok-pixel' | 'linkedin-insight' | 'google-ads' | 'gemini' | 'ai-models';

export interface IntegrationConfigData {
    // Meta Config
    appId?: string;
    appSecret?: string;
    verifyToken?: string;
    accessToken?: string; // Long-lived page token
    pageId?: string; // Facebook Page ID for Webhooks
    phoneNumberId?: string; // WhatsApp
    wabaId?: string; // WhatsApp Business Account ID
    pixelId?: string; // Facebook Pixel
    capiToken?: string; // Conversions API Access Token

    // Google Config
    measurementId?: string; // GA4 Measurement ID (G-XXXXXXXX) — used by gtag.js in browser
    propertyId?: string; // GA4 Property ID (numeric) — used by server-side Reporting API
    apiSecret?: string; // GA4 Measurement Protocol API Secret
    clientEmail?: string; // GA4 Data API Service Account
    privateKey?: string; // GA4 Data API Private Key
    containerId?: string; // GTM
    googleAdsId?: string; // Google Ads AW- tag
    googleAdsDeveloperToken?: string; // Google Ads API Developer Token
    googleAdsManagerId?: string; // Google Ads MCC ID
    googleAdsCustomerId?: string; // Google Ads Customer ID
    googleAdsConversionActionId?: string; // Google Ads Conversion Action ID
    googleAdsAccessToken?: string; // Google Ads OAuth Access Token
    googleWebhookKey?: string; // Secret key for Google Lead Forms Webhook

    // Frontier AI Models Config
    openAiApiKey?: string;
    anthropicApiKey?: string;
    geminiApiKey?: string;
    deepseekApiKey?: string;
    mistralApiKey?: string;
    xaiApiKey?: string;

    // Hotjar Config
    siteId?: string;

    // TikTok Config
    tiktokPixelId?: string; // TikTok Pixel ID
    tiktokAccessToken?: string; // TikTok Events API Access Token

    // LinkedIn Config
    linkedinPartnerId?: string; // LinkedIn Insight Tag Partner ID
    linkedinAccessToken?: string; // LinkedIn Conversions API Token
    linkedinConversionId?: string; // LinkedIn Conversions API Rule ID
    linkedinWebhookKey?: string; // Secret key for LinkedIn Lead Gen Webhook
}

export async function getIntegrationConfig(provider: IntegrationProvider): Promise<IntegrationConfigData | null> {
    const session = await auth();
    if (!session?.user?.email) return null; // Simple auth check

    // Get user's company
    const companyUser = await prisma.companyUser.findFirst({
        where: { userId: session.user.id },
        select: { companyId: true }
    });

    if (!companyUser) return null;

    const config = await prisma.integrationConfig.findUnique({
        where: {
            companyId_provider: {
                companyId: companyUser.companyId,
                provider
            }
        }
    });

    if (!config || !config.config) return null;

    return config.config as unknown as IntegrationConfigData;
}

export async function updateIntegrationConfig(provider: IntegrationProvider, data: IntegrationConfigData) {
    console.log(`[IntegrationConfig] Updating config for ${provider}...`);
    try {
        const session = await auth();
        if (!session?.user?.email || !session?.user?.id) {
            console.error("[IntegrationConfig] No session or user email/id found.");
            throw new Error("Unauthorized");
        }

        console.log(`[IntegrationConfig] User ID: ${session.user.id}`);

        // --- ACTIVE VALIDATION PING ---
        // Verificamos de forma dura ante el data center antes de permitir guardar
        if (provider === 'facebook-pixel') {
            const pixelId = data.pixelId;
            const accessToken = data.capiToken || data.accessToken;
            if (pixelId && accessToken) {
                const fbRes = await fetch(`https://graph.facebook.com/v19.0/${pixelId}/?access_token=${accessToken}`);
                const fbData = await fbRes.json();
                if (fbData.error) {
                    throw new Error(`Meta API Credencial Rechazada: ${fbData.error.message}`);
                }
            }
        }

        if (provider === 'tiktok-pixel') {
            const pixelId = data.tiktokPixelId;
            const accessToken = data.tiktokAccessToken;
            if (pixelId && accessToken) {
                const ttPayload = {
                    pixel_code: pixelId,
                    event: "TestEvent",
                    event_id: "TEST_VALIDATION_" + Date.now(),
                    timestamp: new Date().toISOString(),
                    test_event_code: "TEST_CAPI_VALIDATION",
                    context: { user: {} }
                };
                const ttRes = await fetch("https://business-api.tiktok.com/open_api/v1.3/pixel/track/", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Access-Token": accessToken
                    },
                    body: JSON.stringify(ttPayload)
                });
                const ttData = await ttRes.json();
                if (ttData.code !== 0) {
                    throw new Error(`TikTok API Credencial Rechazada: ${ttData.message}`);
                }
            } else {
                throw new Error("Pixel ID o Access Token vacíos.");
            }
        }

        if (provider === 'gemini' || provider === 'ai-models') {
            const pings = [];
            
            // 1. Google Gemini
            if (data.geminiApiKey) {
                pings.push(fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${data.geminiApiKey}`, {
                    method: "POST", headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ contents: [{ parts: [{ text: "ping" }] }] })
                }).then(async res => {
                    if (!res.ok) {
                        const err = await res.json().catch(() => ({}));
                        throw new Error(`Google Gemini API Rechazada: ${err?.error?.message || "Token inválido"}`);
                    }
                }));
            }

            // 2. OpenAI
            if (data.openAiApiKey) {
                pings.push(fetch("https://api.openai.com/v1/models", {
                    headers: { "Authorization": `Bearer ${data.openAiApiKey}` }
                }).then(async res => {
                    if (!res.ok) {
                        const err = await res.json().catch(() => ({}));
                        throw new Error(`OpenAI API Rechazada: ${err?.error?.message || "Token inválido"}`);
                    }
                }));
            }

            // 3. Anthropic (Claude)
            if (data.anthropicApiKey) {
                pings.push(fetch("https://api.anthropic.com/v1/models", {
                    headers: { "x-api-key": data.anthropicApiKey, "anthropic-version": "2023-06-01" }
                }).then(async res => {
                    if (!res.ok) {
                        const err = await res.json().catch(() => ({}));
                        throw new Error(`Anthropic API Rechazada: ${err?.error?.message || "Token inválido"}`);
                    }
                }));
            }

            // 4. DeepSeek
            if (data.deepseekApiKey) {
                pings.push(fetch("https://api.deepseek.com/models", {
                    headers: { "Authorization": `Bearer ${data.deepseekApiKey}` }
                }).then(async res => {
                    if (!res.ok) {
                        const err = await res.json().catch(() => ({}));
                        throw new Error(`DeepSeek API Rechazada: ${err?.error?.message || "Token inválido"}`);
                    }
                }));
            }

            // 5. Mistral
            if (data.mistralApiKey) {
                pings.push(fetch("https://api.mistral.ai/v1/models", {
                    headers: { "Authorization": `Bearer ${data.mistralApiKey}` }
                }).then(async res => {
                    if (!res.ok) {
                        const err = await res.json().catch(() => ({}));
                        throw new Error(`Mistral API Rechazada: ${err?.message || "Token inválido"}`);
                    }
                }));
            }

            // 6. xAI (Grok)
            if (data.xaiApiKey) {
                pings.push(fetch("https://api.x.ai/v1/models", {
                    headers: { "Authorization": `Bearer ${data.xaiApiKey}` }
                }).then(async res => {
                    if (!res.ok) {
                        const err = await res.json().catch(() => ({}));
                        throw new Error(`xAI (Grok) API Rechazada: ${err?.error?.message || "Token inválido"}`);
                    }
                }));
            }

            // Wait for all active validation pings concurrently
            if (pings.length > 0) {
                await Promise.all(pings);
            }
        }

        if (provider === 'google-analytics') {
            const measurementId = data.measurementId;
            const apiSecret = data.apiSecret;

            // 1. Validate measurementId format (must be G-XXXXXXXXXX)
            if (measurementId) {
                const gaMeasurementPattern = /^G-[A-Z0-9]{4,12}$/;
                if (!gaMeasurementPattern.test(measurementId.toUpperCase())) {
                    throw new Error("Google Analytics: El Measurement ID tiene un formato inválido. Debe ser G-XXXXXXXXXX (ej: G-RMWNP2BSVY). Encuéntralo en GA4 → Admin → Flujos de datos.");
                }
            }

            // 2. Require apiSecret for server-side events (it's mandatory for S2S dispatch)
            if (measurementId && !apiSecret) {
                throw new Error("Google Analytics: El campo 'Measurement Protocol API Secret' es obligatorio para envíos Server-Side (S2S). Genéralo en GA4 → Admin → Flujos de datos → Eventos de protocolo de medición.");
            }

            // 3. Ping the debug endpoint with both credentials
            if (measurementId && apiSecret) {
                const gaRes = await fetch(
                    `https://www.google-analytics.com/debug/mp/collect?measurement_id=${measurementId}&api_secret=${apiSecret}`,
                    {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            client_id: 'test_validation_client',
                            events: [{ name: 'test_validation_event', params: {} }]
                        })
                    }
                );

                // GA4 debug endpoint always returns 200, but with an error body if api_secret is invalid
                const gaData = await gaRes.json().catch(() => null);
                // If the api_secret is wrong, GA4 returns a non-200 status OR a body with hitParsingResult errors
                if (!gaRes.ok) {
                    throw new Error(`Google Analytics: Credenciales rechazadas por Google (HTTP ${gaRes.status}). Verifica tu API Secret.`);
                }
                // If hitParsingResult shows errors for the api_secret itself (not data issues), reject
                if (gaData?.hitParsingResult?.[0]?.valid === false) {
                    const errMsg = gaData.hitParsingResult[0]?.parserMessage?.[0]?.description || 'Credenciales inválidas';
                    throw new Error(`Google Analytics: ${errMsg}`);
                }
            }
        }

        if (provider === 'whatsapp') {
            const phoneId = data.phoneNumberId;
            const accessToken = data.accessToken;
            if (phoneId && accessToken) {
                const waRes = await fetch(`https://graph.facebook.com/v19.0/${phoneId}/?access_token=${accessToken}`);
                const waData = await waRes.json();
                if (waData.error) {
                    throw new Error(`WhatsApp API Credencial Rechazada: ${waData.error.message}`);
                }
            }
        }

        if (provider === 'linkedin-insight') {
            const accessToken = data.linkedinAccessToken;
            if (accessToken) {
                // LinkedIn OpenID UserInfo is the only public non-OAuth-dance endpoint to verify a token
                const liRes = await fetch('https://api.linkedin.com/v2/userinfo', {
                    headers: { 'Authorization': `Bearer ${accessToken}` }
                });
                if (!liRes.ok) {
                    const liData = await liRes.json().catch(() => ({}));
                    throw new Error(`LinkedIn API Credencial Rechazada: ${(liData as any)?.message || 'Token inválido o expirado'}`);
                }
            }
        }

        if (provider === 'google-ads') {
            const oauthToken = data.googleAdsAccessToken;
            if (oauthToken) {
                // Google OAuth2 token introspection - works for any valid Google access token
                const gadsRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?access_token=${oauthToken}`);
                if (!gadsRes.ok) {
                    throw new Error("Google Ads Credencial Rechazada: El Access Token OAuth2 es inválido o expiró. Genera uno nuevo desde Google Cloud Console.");
                }
            }
            // Validate Developer Token format (always starts with specific pattern)
            if (data.googleAdsDeveloperToken) {
                const dtPattern = /^[a-zA-Z0-9_-]{22,}$/;
                if (!dtPattern.test(data.googleAdsDeveloperToken)) {
                    throw new Error("Google Ads: El formato del Developer Token es inválido. Debe ser una cadena alfanumérica de al menos 22 caracteres.");
                }
            }
        }

        if (provider === 'google-tag-manager') {
            const containerId = data.containerId;
            if (containerId) {
                const gtmPattern = /^GTM-[A-Z0-9]{4,8}$/;
                if (!gtmPattern.test(containerId.toUpperCase())) {
                    throw new Error("Google Tag Manager: El Container ID es inválido. Debe seguir el formato GTM-XXXXXXX (ej: GTM-ABC1234).");
                }
            }
        }

        if (provider === 'hotjar') {
            const siteId = data.siteId;
            if (siteId) {
                // Hotjar Site IDs are always numeric and between 5-8 digits
                const hjPattern = /^\d{5,8}$/;
                if (!hjPattern.test(siteId)) {
                    throw new Error("Hotjar: El Site ID es inválido. Debe ser un número entre 5 y 8 dígitos (ej: 1234567). Encuéntralo en Hotjar Settings > Sites & Organizations.");
                }
            }
        }
        // --------------------------------

        const companyUser = await prisma.companyUser.findFirst({
            where: { userId: session.user.id },
            select: { companyId: true }
        });

        if (!companyUser) {
            console.warn(`[IntegrationConfig] No companyUser link found for user ${session.user.id}. Attempting to find/create company...`);

            // Fallback 1: Check if any company exists and link to it (Single Tenant Mode)
            const firstCompany = await prisma.company.findFirst();

            if (firstCompany) {
                console.log(`[IntegrationConfig] Linking user to existing company: ${firstCompany.id}`);
                await prisma.companyUser.create({
                    data: {
                        userId: session.user.id,
                        companyId: firstCompany.id,
                        role: 'OWNER' // Assume owner since they are configuring integrations
                    }
                });
                // Continue with this company
                const result = await prisma.integrationConfig.upsert({
                    where: {
                        companyId_provider: {
                            companyId: firstCompany.id,
                            provider
                        }
                    },
                    update: {
                        config: data as any,
                        isEnabled: true
                    },
                    create: {
                        companyId: firstCompany.id,
                        provider,
                        config: data as any,
                        isEnabled: true
                    }
                });
                console.log(`[IntegrationConfig] Saved successfully (with new link). ID: ${result.id}`);
                revalidatePath('/dashboard/settings/integrations');
                return { success: true };
            } else {
                // Fallback 2: Create a default Company
                console.log(`[IntegrationConfig] No company found at all. Creating default company.`);
                const newCompany = await prisma.company.create({
                    data: {
                        name: 'My Company',
                        slug: 'my-company-' + Math.random().toString(36).substring(7),
                        members: {
                            create: {
                                userId: session.user.id,
                                role: 'OWNER'
                            }
                        }
                    }
                });

                const result = await prisma.integrationConfig.upsert({
                    where: {
                        companyId_provider: {
                            companyId: newCompany.id,
                            provider
                        }
                    },
                    update: {
                        config: data as any,
                        isEnabled: true
                    },
                    create: {
                        companyId: newCompany.id,
                        provider,
                        config: data as any,
                        isEnabled: true
                    }
                });
                console.log(`[IntegrationConfig] Saved successfully (new company created). ID: ${result.id}`);
                revalidatePath('/dashboard/settings/integrations');
                return { success: true };
            }
        }

        console.log(`[IntegrationConfig] Found Company ID: ${companyUser.companyId}`);

        const result = await prisma.integrationConfig.upsert({
            where: {
                companyId_provider: {
                    companyId: companyUser.companyId,
                    provider
                }
            },
            update: {
                config: data as any,
                isEnabled: true
            },
            create: {
                companyId: companyUser.companyId,
                provider,
                config: data as any,
                isEnabled: true
            }
        });

        console.log(`[IntegrationConfig] Saved successfully. ID: ${result.id}`);
        revalidatePath('/dashboard/settings/integrations');
        return { success: true };
    } catch (error: any) {
        console.error("[IntegrationConfig] Error updating config:", error);
        throw new Error(error.message || "Failed to update configuration");
    }
}
