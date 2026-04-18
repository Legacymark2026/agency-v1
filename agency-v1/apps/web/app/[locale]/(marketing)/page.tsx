import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { siteConfig } from '@/lib/site-config';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'home.metadata' });

    return {
        title: t('title'),
        description: t('description'),
        openGraph: {
            title: t('title'),
            description: t('description'),
            url: `${siteConfig.url}/${locale}`,
            siteName: siteConfig.name,
            images: [
                {
                    url: siteConfig.ogImage,
                    width: 1200,
                    height: 630,
                    alt: t('title'),
                },
            ],
            locale: locale === 'en' ? 'en_US' : 'es_ES',
            type: 'website',
        },
        alternates: {
            canonical: `${siteConfig.url}/${locale}`,
            languages: {
                'es': `${siteConfig.url}/es`,
                'en': `${siteConfig.url}/en`,
            },
        },
    };
}

// Re-export the main marketing page — content is i18n-aware via NextIntlClientProvider in layout
export { default } from '@/app/(marketing)/page';
