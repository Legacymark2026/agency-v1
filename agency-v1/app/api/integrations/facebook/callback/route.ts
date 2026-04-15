
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
    const searchParams = req.nextUrl.searchParams;
    const code = searchParams.get("code");
    const error = searchParams.get("error");

    if (error) {
        return NextResponse.redirect(new URL("/dashboard/settings/integrations?error=" + error, req.url));
    }

    if (!code) {
        return NextResponse.redirect(new URL("/dashboard/settings/integrations?error=no_code", req.url));
    }

    try {
        const session = await auth();
        // Note: Check session usually, but for callback we might rely on state or just identifying the user 
        // For now, let's assume valid session or we can't save.
        if (!session?.user?.id) {
            return NextResponse.redirect(new URL("/auth/login?returnUrl=/dashboard/settings/integrations", req.url));
        }

        // 1. Get App Config from DB directly (bypass session requirement)
        // FIX: Search ALL relevant providers (new family: meta-app/facebook-page, AND legacy: facebook)
        console.log("[Facebook Callback] Querying IntegrationConfig for app credentials...");

        const allConfigs = await prisma.integrationConfig.findMany({
            where: {
                provider: { in: ['facebook_ads', 'facebook-page', 'facebook', 'meta-app', 'instagram-page'] }
            },
            orderBy: { createdAt: 'desc' }
        });

        console.log("[Facebook Callback] Found configs in DB:", allConfigs.length);

        // FIX #3: Cast config.config as any to safely access JSON sub-properties
        let config = allConfigs[0] || null;
        const rawCfg = config?.config as any;

        if (config) {
            console.log("[Facebook Callback] Config found, provider:", config.provider);
            console.log("[Facebook Callback] - appId present:", !!(rawCfg?.appId));
            console.log("[Facebook Callback] - appSecret present:", !!(rawCfg?.appSecret));
        } else {
            console.log("[Facebook Callback] No config found in DB for any provider.");
        }

        // FIX #3: Use safe cast accessors
        let appId = rawCfg?.appId;
        let appSecret = rawCfg?.appSecret;

        // Fallback to Environment Variables if DB config is missing
        if (!appId || !appSecret) {
            console.log("[Facebook Callback] DB Config missing. Checking Environment Variables...");
            
            const envAppId = process.env.FACEBOOK_CLIENT_ID || process.env.META_APP_ID;
            const envAppSecret = process.env.FACEBOOK_CLIENT_SECRET || process.env.META_APP_SECRET;
            
            console.log("[Facebook Callback] - FACEBOOK_CLIENT_ID present:", !!envAppId);
            console.log("[Facebook Callback] - META_APP_ID present:", !!process.env.META_APP_ID);
            console.log("[Facebook Callback] - FACEBOOK_CLIENT_SECRET present:", !!envAppSecret);
            console.log("[Facebook Callback] - META_APP_SECRET present:", !!process.env.META_APP_SECRET);
            
            appId = appId || envAppId;
            appSecret = appSecret || envAppSecret;

            if (appId && appSecret) {
                console.log("[Facebook Callback] Used Environment Variables fallback.");
            }
        }

        if (!appId || !appSecret) {
            const missing = [];
            if (!appId) missing.push("App ID");
            if (!appSecret) missing.push("App Secret");

            console.error(`[Facebook Callback] Missing Config: ${missing.join(", ")}`);
            throw new Error(`Missing Facebook Configuration in DB & Env. Missing: ${missing.join(", ")}. Check FACEBOOK_CLIENT_ID/SECRET.`);
        }

        // 2. Exchange Code for Token
        // CRITICAL: origin must match the one used in the frontend button
        let origin = new URL(req.url).origin;

        // Smart Origin Detection (Aggressive)
        const envUrl = process.env.NEXTAUTH_URL;
        const vercelUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL;

        // Check headers for real host (works behind Vercel/proxies)
        const host = req.headers.get("x-forwarded-host") || req.headers.get("host");
        const protocol = req.headers.get("x-forwarded-proto") || "https";

        if (envUrl && !envUrl.includes("localhost")) {
            origin = envUrl;
        } else if (vercelUrl) {
            origin = `https://${vercelUrl}`;
        } else if (host && !host.includes("localhost")) {
            origin = `${protocol}://${host}`;
        }

        // FINAL SAFETY NET: If we are still "localhost" but clearly not in a local dev environment (no PORT),
        // or just to be absolutely sure for this user:
        if (origin.includes("localhost") && process.env.NODE_ENV === "production") {
            origin = "https://legacymarksas.com";
        }

        // Safety: ensure no trailing slash
        origin = origin.replace(/\/$/, "");

        const redirectUri = `${origin}/api/integrations/facebook/callback`;

        console.log(`[Facebook Callback] Exchanging code for token...`);
        console.log(`[Facebook Callback] Origin used: ${origin}`);
        console.log(`[Facebook Callback] Redirect URI sent to FB: ${redirectUri}`);

        // IMPORTANT: Params must be encoded, also trim to prevent accidental whitespaces
        const cleanAppId = appId.trim();
        const cleanAppSecret = appSecret.trim();
        const tokenUrl = `https://graph.facebook.com/v19.0/oauth/access_token?client_id=${cleanAppId}&redirect_uri=${encodeURIComponent(redirectUri)}&client_secret=${cleanAppSecret}&code=${code}`;

        const tokenRes = await fetch(tokenUrl);
        const tokenData = await tokenRes.json();

        if (tokenData.error) {
            console.error("[Facebook Callback] Token Exchange Error:", JSON.stringify(tokenData.error, null, 2));
            throw new Error(`Facebook Error: ${tokenData.error.message}`);
        }

        const shortLivedToken = tokenData.access_token;

        // 3. Exchange for Long-Lived Token
        const longLivedUrl = `https://graph.facebook.com/v19.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${cleanAppId}&client_secret=${cleanAppSecret}&fb_exchange_token=${shortLivedToken}`;

        const longLivedRes = await fetch(longLivedUrl);
        const longLivedData = await longLivedRes.json();

        const finalToken = longLivedData.access_token || shortLivedToken;

        // 3.5. Fetch the real Facebook User ID
        const meRes = await fetch(`https://graph.facebook.com/v19.0/me?fields=id,name&access_token=${finalToken}`);
        const meData = await meRes.json();

        if (meData.error || !meData.id) {
            console.error("[Facebook Callback] Failed to fetch user ID from /me:", meData.error);
            throw new Error("Could not retrieve Facebook User ID.");
        }

        const facebookUserId = meData.id;
        console.log(`[Facebook Callback] Fetched User ID: ${facebookUserId}`);

        // 4. Save to DB (Configuration)
        // CRITICAL FIX: Writing directly using prisma instead of server action to avoid context issues inside API routes
        try {
            let targetCompanyId = null;
            const userCompany = await prisma.companyUser.findFirst({
                where: { userId: session.user.id },
                select: { companyId: true }
            });

            if (userCompany) {
                targetCompanyId = userCompany.companyId;
            } else {
                const firstCompany = await prisma.company.findFirst();
                if (firstCompany) targetCompanyId = firstCompany.id;
            }

            if (targetCompanyId) {
                // FIX #2: Persist tokens to ALL relevant provider keys so sync never has a desync.
                // Legacy key (for backward compat)
                await prisma.integrationConfig.upsert({
                    where: { companyId_provider: { companyId: targetCompanyId, provider: 'facebook' } },
                    update: { config: { appId, appSecret, accessToken: finalToken } as any, isEnabled: true },
                    create: { companyId: targetCompanyId, provider: 'facebook', config: { appId, appSecret, accessToken: finalToken } as any, isEnabled: true }
                });

                // New meta-app key (shared app credentials)
                await prisma.integrationConfig.upsert({
                    where: { companyId_provider: { companyId: targetCompanyId, provider: 'meta-app' } },
                    update: { config: { appId, appSecret } as any, isEnabled: true },
                    create: { companyId: targetCompanyId, provider: 'meta-app', config: { appId, appSecret } as any, isEnabled: true }
                });

                // New facebook-page key (page access token)
                await prisma.integrationConfig.upsert({
                    where: { companyId_provider: { companyId: targetCompanyId, provider: 'facebook-page' } },
                    update: { config: { accessToken: finalToken, appId, appSecret } as any, isEnabled: true },
                    create: { companyId: targetCompanyId, provider: 'facebook-page', config: { accessToken: finalToken, appId, appSecret } as any, isEnabled: true }
                });

                console.log("[Facebook Callback] Successfully saved IntegrationConfig to all provider keys.");
            } else {
                console.error("[Facebook Callback] Failed to save IntegrationConfig: No company found.");
            }
        } catch (e) {
            console.error("[Facebook Callback] Prisma error saving IntegrationConfig:", e);
        }

        // 4.5 Save to DB (Account/Connection Status)
        // CRITICAL: This is what the UI checks to show "Connected" badge
        if (session?.user?.id) {
            await prisma.account.upsert({
                where: {
                    provider_providerAccountId: {
                        provider: 'facebook',
                        providerAccountId: facebookUserId
                    }
                },
                update: {
                    access_token: finalToken,
                    expires_at: Math.floor(Date.now() / 1000) + (longLivedData.expires_in || 5184000), // 60 days default
                    refresh_token: shortLivedToken,
                },
                create: {
                    userId: session.user.id,
                    type: 'oauth',
                    provider: 'facebook',
                    providerAccountId: facebookUserId,
                    access_token: finalToken,
                    expires_at: Math.floor(Date.now() / 1000) + (longLivedData.expires_in || 5184000),
                    token_type: 'bearer',
                    scope: 'public_profile,email,pages_show_list,pages_read_engagement,pages_manage_metadata,pages_messaging,ads_read,leads_retrieval,instagram_basic,instagram_manage_messages'
                }
            });
            console.log("[Facebook Callback] Account record updated for UI status.");
        }

        // Force revalidation of the settings page so the UI updates immediately
        try {
            const { revalidatePath } = await import("next/cache");
            revalidatePath('/dashboard/settings');
            revalidatePath('/dashboard/settings/integrations');
        } catch (e) {
            console.error("Revalidation failed (non-fatal):", e);
        }

        // 5. Redirect Success
        // Use the sanitized 'origin' to ensure we don't redirect to an internal localhost
        return NextResponse.redirect(`${origin}/dashboard/settings/integrations?success=facebook_connected`);

    } catch (error: any) {
        console.error("[Facebook Callback] Error:", error);
        // Also use sanitized origin for error redirect if possible, otherwise safe fallback
        const base = process.env.NEXTAUTH_URL && !process.env.NEXTAUTH_URL.includes("localhost")
            ? process.env.NEXTAUTH_URL
            : new URL(req.url).origin;

        return NextResponse.redirect(`${base}/dashboard/settings/integrations?error=${encodeURIComponent(error.message)}`);
    }
}
