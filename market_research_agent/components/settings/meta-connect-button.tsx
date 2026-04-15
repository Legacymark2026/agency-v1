"use client";

import { Button } from "@/components/ui/button";
import { signIn } from "next-auth/react";
import { useState } from "react";
import { Loader2 } from "lucide-react";

export function MetaConnectButton({ provider, appId, redirectUri: propRedirectUri }: { provider: string, appId?: string, redirectUri?: string }) {
    const [isLoading, setIsLoading] = useState(false);

    const handleConnect = async () => {
        setIsLoading(true);
        try {
            if (provider === 'facebook' && appId) {
                // Manual OAuth Flow for Dynamic App ID
                const origin = typeof window !== 'undefined' ? window.location.origin : '';
                const redirectUri = propRedirectUri || `${origin}/api/integrations/facebook/callback`;
                const scope = "public_profile,email,pages_show_list,pages_read_engagement,pages_manage_metadata,pages_messaging,ads_read,leads_retrieval,instagram_basic,instagram_manage_messages";
                const state = "custom_integration_flow";

                const authUrl = `https://www.facebook.com/v19.0/dialog/oauth?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}&scope=${scope}&response_type=code`;

                window.location.href = authUrl;
            } else {
                // Fallback to NextAuth if no custom ID (or for other providers)
                await signIn(provider, { callbackUrl: '/dashboard/settings/integrations' });
            }
        } catch (error) {
            console.error("Connection failed", error);
            setIsLoading(false);
        }
    };

    return (
        <Button onClick={handleConnect} disabled={isLoading} size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Connect
        </Button>
    );
}
