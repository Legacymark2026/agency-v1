import type { Metadata } from "next";
import { JetBrains_Mono } from "next/font/google";
import "../styles/globals.css";
import { Providers } from "@/components/providers";
import { AnalyticsProvider } from "@/components/analytics/analytics-provider";
import { AnalyticsProvider as InternalAnalyticsProvider } from "@/modules/analytics/components/analytics-provider";
import { getPublicIntegrations } from "@/actions/settings";
import { auth } from "@/lib/auth";
import { Suspense } from "react";
import { ScrollProgress } from "@/components/ui/scroll-progress";
import { CustomCursor } from "@/components/ui/custom-cursor";
import { AmbientBackground } from "@/components/ui/ambient-background";
import { BackToTop } from "@/components/ui/back-to-top";
import { CookieConsent } from "@/components/ui/cookie-consent";
import { JsonLd } from "@/components/seo/json-ld";
import { CommandMenu } from "@/components/ui/command-menu";
import { PageTransition } from "@/components/ui/page-transition";
import { SocialShare } from "@/components/ui/social-share";
import { ChatWidget } from "@/components/chat/chat-widget";
import { getLocale } from "next-intl/server";

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

import { siteConfig } from "@/lib/site-config";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const openGraphLocale = locale === 'en' ? 'en_US' : 'es_ES';

  return {
    metadataBase: new URL(siteConfig.url),
    title: {
      default: siteConfig.name,
      template: `%s | ${siteConfig.name}`,
    },
    description: siteConfig.description,
    keywords: siteConfig.keywords,
    authors: siteConfig.authors,
    creator: siteConfig.creator,
    openGraph: {
      type: "website",
      locale: openGraphLocale,
      url: siteConfig.url,
      title: siteConfig.name,
      description: siteConfig.description,
      siteName: siteConfig.name,
      images: [
        {
          url: siteConfig.ogImage,
          width: 1200,
          height: 630,
          alt: siteConfig.name,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: siteConfig.name,
      description: siteConfig.description,
      images: [siteConfig.ogImage],
      creator: "@legacymark",
    },
    icons: {
      icon: "/favicon.ico?v=2",
      shortcut: "/favicon-16x16.png?v=2",
      apple: "/apple-touch-icon.png?v=2",
    },
    manifest: "/site.webmanifest",
    verification: {
      other: {
        "facebook-domain-verification": "fm9attbfbqwnfk3yfcn6t8v3rymszu",
      },
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const integrations = await getPublicIntegrations();
  const session = await auth();
  const locale = await getLocale();

  let userData: { em?: string; fn?: string; ln?: string; ph?: string } | undefined;
  if (session?.user) {
    // Advanced Matching format: strictly lowercase string, no leading/trailing spaces
    userData = {
      em: session.user.email?.toLowerCase().trim() || undefined,
      fn: session.user.name?.split(' ')[0]?.toLowerCase().trim() || undefined,
      ln: session.user.name?.split(' ').slice(1).join(' ')?.toLowerCase().trim() || undefined,
    };
    // remove undefined keys
    Object.keys(userData).forEach(key => (userData as any)[key] === undefined && delete (userData as any)[key]);
  }

  return (
    <html lang={locale} suppressHydrationWarning>
      <body
        className={`font-sans ${jetbrainsMono.variable} antialiased selection:bg-teal-500 selection:text-white`}
      >
        <Providers>
          <InternalAnalyticsProvider userId={session?.user?.id}>
            <Suspense fallback={null}>
              <AnalyticsProvider config={{
                ...integrations,
                userData,
                debug: process.env.NODE_ENV === 'development'
              }} />
            </Suspense>

            <ScrollProgress />
            <CustomCursor />
            <AmbientBackground />
            <JsonLd />
            <CommandMenu />
            <SocialShare url={siteConfig.url} title={siteConfig.description} />
            <PageTransition>
              {children}
            </PageTransition>
            <BackToTop />
            <CookieConsent />
            <ChatWidget />
          </InternalAnalyticsProvider>
        </Providers>
      </body>
    </html>
  );
}
