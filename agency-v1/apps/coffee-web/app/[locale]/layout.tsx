import type { Metadata } from "next";
import { Cinzel_Decorative, Quattrocento_Sans } from "next/font/google";
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations } from 'next-intl/server';
import "../../styles/globals.css";
import FloatingChats from "@/components/sections/FloatingChats";

const cinzel = Cinzel_Decorative({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-cinzel",
});

const quattrocento = Quattrocento_Sans({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-quattrocento",
});

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  let t;
  try {
    t = await getTranslations({ locale, namespace: 'metadata' });
  } catch (e) {
    return {
      title: "Goldneez | Café de Especialidad",
      description: "Café de especialidad tostado artesanalmente."
    };
  }

  return {
    title: t('title'),
    description: t('description'),
    icons: {
      icon: "/favicon.ico",
    }
  };
}

export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const messages = await getMessages();

  return (
    <html lang={locale} className={`${cinzel.variable} ${quattrocento.variable}`}>
      <body className="bg-black text-aluminum font-quattrocento antialiased selection:bg-amber/30 selection:text-amber">
        <NextIntlClientProvider messages={messages}>
          {children}
          <FloatingChats />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
