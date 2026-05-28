import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
    try {
        const url = new URL(req.url);
        const code = url.searchParams.get("code");
        const stateBase64 = url.searchParams.get("state");
        const error = url.searchParams.get("error");

        if (error) {
            return NextResponse.redirect(`${req.nextUrl.origin}/dashboard/settings/integrations?error=${error}`);
        }

        if (!code || !stateBase64) {
            return new NextResponse("Missing code or state", { status: 400 });
        }

        // Decode state
        const state = JSON.parse(Buffer.from(stateBase64, 'base64').toString('utf-8'));
        const { provider, userId } = state;

        if (!provider || !userId) {
            return new NextResponse("Invalid state parameter", { status: 400 });
        }

        // 1. Get the user's companyId
        const companyUser = await prisma.companyUser.findFirst({
            where: { userId },
            select: { companyId: true }
        });

        if (!companyUser) {
            return new NextResponse("User not linked to any company", { status: 400 });
        }

        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin;
        const redirectUri = `${baseUrl}/api/integrations/oauth/callback`;

        let accessToken = "";
        let refreshToken = "";

        // 2. Exchange Code for Token (Real logic)
        if (provider === "hubspot") {
            const tokenRes = await fetch("https://api.hubapi.com/oauth/v1/token", {
                method: "POST",
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                body: new URLSearchParams({
                    grant_type: "authorization_code",
                    client_id: process.env.HUBSPOT_CLIENT_ID || "",
                    client_secret: process.env.HUBSPOT_CLIENT_SECRET || "",
                    redirect_uri: redirectUri,
                    code: code
                })
            });

            const data = await tokenRes.json();
            if (!tokenRes.ok) {
                console.error("[HubSpot Token Error]", data);
                return NextResponse.redirect(`${req.nextUrl.origin}/dashboard/settings/integrations?error=hubspot_token_failed`);
            }

            accessToken = data.access_token;
            refreshToken = data.refresh_token;
        } else if (provider === "mailchimp") {
            const mcClientId = process.env.MAILCHIMP_CLIENT_ID;
            const mcClientSecret = process.env.MAILCHIMP_CLIENT_SECRET;

            if (!mcClientId || !mcClientSecret) {
                return NextResponse.redirect(
                    `${req.nextUrl.origin}/dashboard/settings/integrations?error=mailchimp_not_configured&detail=${encodeURIComponent('MAILCHIMP_CLIENT_ID y MAILCHIMP_CLIENT_SECRET no están configurados en el servidor.')}`
                );
            }

            const tokenRes = await fetch("https://login.mailchimp.com/oauth2/token", {
                method: "POST",
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                body: new URLSearchParams({
                    grant_type: "authorization_code",
                    client_id: mcClientId,
                    client_secret: mcClientSecret,
                    redirect_uri: redirectUri,
                    code: code,
                }),
            });

            const data = await tokenRes.json();
            if (!tokenRes.ok || !data.access_token) {
                console.error("[Mailchimp Token Error]", data);
                return NextResponse.redirect(
                    `${req.nextUrl.origin}/dashboard/settings/integrations?error=mailchimp_token_failed&detail=${encodeURIComponent(data.error_description || data.error || 'Token exchange failed')}`
                );
            }

            accessToken = data.access_token;
            // Mailchimp uses OAuth2 without refresh tokens (tokens don't expire unless revoked)

        } else {
            return new NextResponse(`Provider ${provider} exchange not implemented`, { status: 400 });
        }

        // 3. Save the token in DB
        await prisma.integrationConfig.upsert({
            where: {
                companyId_provider: {
                    companyId: companyUser.companyId,
                    provider: provider
                }
            },
            update: {
                config: { accessToken, refreshToken },
                isEnabled: true
            },
            create: {
                companyId: companyUser.companyId,
                provider: provider,
                config: { accessToken, refreshToken },
                isEnabled: true
            }
        });

        // 4. Trigger initial Synchronization
        if (provider === "hubspot") {
            const { syncHubSpotContacts } = await import("@/lib/integrations/sync/hubspot.service");
            // Run asynchronously so we don't block the redirect response
            syncHubSpotContacts(companyUser.companyId).catch(console.error);
        }

        // Return to integrations page with success flag
        return NextResponse.redirect(`${req.nextUrl.origin}/dashboard/settings/integrations?success=${provider}`);
    } catch (err: any) {
        console.error("[OAuth Callback Error]", err);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
