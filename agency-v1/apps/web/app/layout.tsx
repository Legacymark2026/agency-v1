import type { Metadata } from "next";
import { JetBrains_Mono } from "next/font/google";
import "../styles/globals.css";
import { Providers } from "@/components/providers";
import { AnalyticsProvider } from "@/components/analytics/analytics-provider";
import { AnalyticsProvider as InternalAnalyticsProvider } from "@/modules/analytics/components/analytics-provider";
import { getPublicIntegrations } from "@/actions/settings";
import { auth } from "@/lib/auth";
import { Suspense } from "react";
import { getLocale, getTranslations } from "next-intl/server";
import { headers } from "next/headers";
import { ClientDecorativeElements } from "@/components/layout/client-decorative-elements";

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

import { siteConfig } from "@/lib/site-config";
import { JsonLd } from "@/components/seo/json-ld";
import { PageTransition } from "@/components/ui/page-transition";

export async function generateMetadata(): Promise<Metadata> {
  let locale = "es";
  let t: (key: string) => string;

  try {
    locale = await getLocale();
    const translations = await getTranslations({ locale, namespace: "home.metadata" });
    t = (key) => translations(key);
  } catch (e) {
    console.warn("[next-intl] getLocale/getTranslations failed in RootLayout generateMetadata (likely bypassed in middleware):", e);
    t = (key) => {
      if (key === "title") return "LegacyMark | Plataforma de Operaciones de Marketing y CRM";
      if (key === "description") return "Gestiona tus campañas, leads, automatizaciones y analíticas desde un solo panel de control unificado.";
      return key;
    };
  }

  const headersList = await headers();
  const pathname = headersList.get("x-pathname") || "";
  const openGraphLocale = locale === 'en' ? 'en_US' : 'es_ES';

  const canonicalUrl = `${siteConfig.url}${pathname}`;

  return {
    metadataBase: new URL(siteConfig.url),
    alternates: {
      canonical: canonicalUrl,
      languages: {
        'es-ES': `${siteConfig.url}/es${pathname.replace(/^\/(es|en)/, '')}`,
        'en-US': `${siteConfig.url}/en${pathname.replace(/^\/(es|en)/, '')}`,
        'x-default': `${siteConfig.url}/es${pathname.replace(/^\/(es|en)/, '')}`,
      },
    },
    title: {
      default: t("title"),
      template: `%s | ${siteConfig.name}`,
    },
    description: t("description"),
    keywords: siteConfig.keywords,
    authors: siteConfig.authors,
    creator: siteConfig.creator,
    openGraph: {
      type: "website",
      locale: openGraphLocale,
      url: canonicalUrl,
      title: t("title"),
      description: t("description"),
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
      title: t("title"),
      description: t("description"),
      images: [siteConfig.ogImage],
      creator: "@legacymark",
    },
    icons: {
      icon: [
        { url: "/favicon.ico", sizes: "any" },
        { url: "/favicon.ico?v=3", sizes: "any" },
      ],
      shortcut: "/favicon.ico",
      apple: "/apple-touch-icon.png",
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
  let integrations = {
    fbPixelId: "",
    gtmId: "",
    hotjarId: "",
    ahrefsDataKey: "",
    gaPropertyId: "",
    tiktokPixelId: "",
    linkedinPartnerId: "",
    googleAdsId: "",
  };
  let session = null;

  try {
    integrations = await getPublicIntegrations();
  } catch (error) {
    console.error("[RootLayout] Non-fatal: Failed to load public integrations:", error);
  }

  try {
    session = await auth();
  } catch (error) {
    console.error("[RootLayout] Non-fatal: Failed to resolve auth session:", error);
    session = null;
  }
  
  let locale = "es";
  try {
    locale = await getLocale();
  } catch (e) {
    console.warn("[next-intl] getLocale failed in RootLayout (likely bypassed in middleware):", e);
  }

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
        suppressHydrationWarning
        className={`font-sans ${jetbrainsMono.variable} antialiased selection:bg-teal-500 selection:text-white`}
      >
        {/* SEO & Hydration Debug Error Logger - HIDDEN, for headless/bot analysis only */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                var errDiv = null;
                function logError(type, message, source, lineno, colno, error) {
                  try {
                    if (!errDiv) {
                      errDiv = document.createElement('div');
                      errDiv.id = 'seo-debug-errors';
                      errDiv.style.display = 'none'; // Hidden from view - for bot/headless analysis only
                      document.body.appendChild(errDiv);
                    }
                    var stack = error && error.stack ? error.stack : 'No stack trace available';
                    var item = document.createElement('div');
                    item.setAttribute('data-type', type);
                    item.setAttribute('data-source', source + ':' + lineno + ':' + colno);
                    item.textContent = message + ' | ' + stack;
                    errDiv.appendChild(item);
                    console.error('[SEO-DEBUG] ' + type + ':', message, '\\n', source, lineno, colno);
                  } catch(e) {}
                }

                window.onerror = function(message, source, lineno, colno, error) {
                  logError('uncaughtException', message, source, lineno, colno, error);
                  return false;
                };

                window.addEventListener('error', function(event) {
                  if (event.error) {
                    logError('errorEvent', event.message, event.filename, event.lineno, event.colno, event.error);
                  }
                }, true);

                window.addEventListener('unhandledrejection', function(event) {
                  var reason = event.reason;
                  var msg = reason instanceof Error ? reason.message : String(reason);
                  var stack = reason instanceof Error ? reason.stack : '';
                  logError('unhandledRejection', msg, 'Promise', 0, 0, { stack: stack });
                });
              })();
            `
          }}
        />
        <Providers session={session}>
          <InternalAnalyticsProvider userId={session?.user?.id}>
            <Suspense fallback={null}>
              <AnalyticsProvider config={{
                ...integrations,
                userData,
                debug: process.env.NODE_ENV === 'development'
              }} />
            </Suspense>

            <JsonLd locale={locale} />
            <PageTransition>
              {children}
            </PageTransition>
            <ClientDecorativeElements locale={locale} />
          </InternalAnalyticsProvider>
        </Providers>
      </body>
    </html>
  );
}
