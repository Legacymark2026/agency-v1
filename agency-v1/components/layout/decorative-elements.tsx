"use client";

import { CustomCursor } from "@/components/ui/custom-cursor";
import { AmbientBackground } from "@/components/ui/ambient-background";
import { ScrollProgress } from "@/components/ui/scroll-progress";
import { CommandMenu } from "@/components/ui/command-menu";
import { SocialShare } from "@/components/ui/social-share";
import { ChatWidget } from "@/components/chat/chat-widget";
import { BackToTop } from "@/components/ui/back-to-top";
import { CookieConsent } from "@/components/ui/cookie-consent";
import { siteConfig } from "@/lib/site-config";

/**
 * DecorativeElements - A client-side wrapper for non-critical UI.
 * This ensures that environment-dependent components only mount on the client,
 * bypassing SSR completely to prevent hydration mismatches (Error #418).
 */
export function DecorativeElements({ locale }: { locale: string }) {
    return (
        <>
            <ScrollProgress />
            <CustomCursor />
            <AmbientBackground />
            <CommandMenu />
            <SocialShare url={siteConfig.url} title={siteConfig.description} />
            <BackToTop />
            <CookieConsent />
            <ChatWidget />
        </>
    );
}
