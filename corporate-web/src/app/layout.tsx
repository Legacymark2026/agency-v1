import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import PublicSiteWrapper from "@/components/PublicSiteWrapper";
import AnalyticsTracker from "@/components/AnalyticsTracker";
import CookieConsentBanner from "@/components/CookieConsentBanner";
import ThirdPartyTrackers from "@/components/ThirdPartyTrackers";
import { getActiveIntegrations } from "@/lib/integrations";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "NEOGESTIÓN | Transformamos la complejidad en eficiencia",
  description:
    "Ecosistema de tecnología, consultoría y formación empresarial. NeoGestión es un producto de Consultoría de Colombia S.A.S. especializado en estrategia corporativa, optimización de procesos y sistemas integrados de gestión.",
  keywords: [
    "NEOGESTIÓN",
    "Consultoría de Colombia S.A.S.",
    "consultoría estratégica",
    "software de gestión",
    "eficiencia corporativa",
    "transformación digital",
    "inteligencia de datos",
    "ciberseguridad corporativa",
    "optimización de procesos",
  ],
  authors: [{ name: "Consultoría de Colombia S.A.S." }, { name: "NEOGESTIÓN" }],
  openGraph: {
    title: "NEOGESTIÓN | Transformamos la complejidad en eficiencia",
    description:
      "Soluciones estratégicas y software de gestión para comités directivos y empresas líderes. Un producto de Consultoría de Colombia S.A.S.",
    type: "website",
    locale: "es_ES",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const integrations = await getActiveIntegrations();

  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full scroll-smooth antialiased`}
    >
      <head>
        {integrations?.gscEnabled && integrations.googleSearchConsoleMeta ? (
          <meta
            name="google-site-verification"
            content={integrations.googleSearchConsoleMeta}
          />
        ) : null}
      </head>
      <body className="min-h-full flex flex-col bg-white text-slate-900 selection:bg-[#B08A1A] selection:text-slate-950">
        <PublicSiteWrapper>{children}</PublicSiteWrapper>
        <AnalyticsTracker />
        <ThirdPartyTrackers integrations={integrations} />
        <CookieConsentBanner />
      </body>
    </html>
  );
}


