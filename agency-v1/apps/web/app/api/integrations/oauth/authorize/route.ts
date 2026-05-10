import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const url = new URL(req.url);
        const provider = url.searchParams.get("provider");

        if (!provider) {
            return new NextResponse("Provider is required", { status: 400 });
        }

        // Define OAuth Configurations
        const OAUTH_CONFIGS: Record<string, { authUrl: string; clientId: string; scopes: string[] }> = {
            "hubspot": {
                authUrl: "https://app.hubspot.com/oauth/authorize",
                clientId: process.env.HUBSPOT_CLIENT_ID || "",
                scopes: ["crm.objects.contacts.read", "crm.objects.contacts.write"]
            },
            "mailchimp": {
                authUrl: "https://login.mailchimp.com/oauth2/authorize",
                clientId: process.env.MAILCHIMP_CLIENT_ID || "",
                scopes: []
            }
        };

        const config = OAUTH_CONFIGS[provider];

        if (!config) {
            // For providers we haven't implemented REAL OAuth yet, we simulate the redirect
            // to show the UI structure, but it will error out if they try to use it
            return new NextResponse(`El proveedor ${provider} todavía no tiene la App de Desarrollador configurada en LegacyMark.`, { status: 400 });
        }

        if (!config.clientId) {
            return new NextResponse(`Falta el Client ID para ${provider}. Configúralo en las variables de entorno.`, { status: 400 });
        }

        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin;
        const redirectUri = `${baseUrl}/api/integrations/oauth/callback`;

        // Generate the state parameter to prevent CSRF and pass the provider
        const state = Buffer.from(JSON.stringify({ provider, userId: session.user.id })).toString('base64');

        // Build the authorization URL
        const authUrl = new URL(config.authUrl);
        authUrl.searchParams.set("client_id", config.clientId);
        authUrl.searchParams.set("redirect_uri", redirectUri);
        authUrl.searchParams.set("response_type", "code");
        authUrl.searchParams.set("state", state);

        if (config.scopes.length > 0) {
            authUrl.searchParams.set("scope", config.scopes.join(" "));
        }

        // Redirect the user to the real provider's OAuth page
        return NextResponse.redirect(authUrl.toString());
    } catch (error: any) {
        console.error("[OAuth Authorize Error]", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
