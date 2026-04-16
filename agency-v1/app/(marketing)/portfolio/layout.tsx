import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { siteConfig } from "@/lib/site-config";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
    // If layout is outside of `[locale]`, it won't receive `locale` in `params` natively in this structure,
    // so we hardcode to the current setup or assume a default logic. Let's provide a robust version.
    let locale = 'es';
    try {
        const resolvedParams = await params;
        if (resolvedParams && resolvedParams.locale) {
            locale = resolvedParams.locale;
        }
    } catch (e) {
        // Fallback to 'es'
    }

    const t = await getTranslations({ locale, namespace: 'portfolioPage.meta' });

    return {
        title: t('title'),
        description: t('description'),
        openGraph: {
            title: t('title'),
            description: t('description'),
            url: `${siteConfig.url}/${locale}/portfolio`,
            siteName: siteConfig.name,
            locale: locale === 'en' ? 'en_US' : 'es_ES',
            type: 'website',
        },
        alternates: {
            canonical: `${siteConfig.url}/${locale}/portfolio`,
            languages: {
                'es': `${siteConfig.url}/es/portfolio`,
                'en': `${siteConfig.url}/en/portfolio`,
            },
        },
    };
}

export default function PortfolioLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
