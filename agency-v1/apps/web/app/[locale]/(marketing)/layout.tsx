import { NextIntlClientProvider, hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { WhatsAppButton } from "@/components/layout/whatsapp-button";
import { TopBar } from "@/components/layout/top-bar";

export function generateStaticParams() {
    return routing.locales.map((locale) => ({ locale }));
}

/**
 * Locale-scoped marketing layout.
 * NextIntlClientProvider MUST live here: every client section of the landing
 * (useTranslations) depends on it. Removing it causes a hydration crash
 * ("No intl context found") that surfaces as the global "Error de Aplicación".
 */
export default async function LocaleMarketingLayout({
    children,
    params,
}: {
    children: React.ReactNode;
    params: Promise<{ locale: string }>;
}) {
    const { locale } = await params;
    if (!hasLocale(routing.locales, locale)) {
        notFound();
    }

    setRequestLocale(locale);
    const messages = (await import(`@/messages/${locale}.json`)).default;

    return (
        <NextIntlClientProvider locale={locale} messages={messages}>
            <div className="flex min-h-screen flex-col overflow-x-hidden">
                <TopBar />
                <Header />
                <main className="flex-1">{children}</main>
                <Footer />
                <WhatsAppButton />
            </div>
        </NextIntlClientProvider>
    );
}
