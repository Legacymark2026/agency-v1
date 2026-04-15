import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata({ params: { locale } }: { params: { locale: string } }): Promise<Metadata> {
    const t = await getTranslations({ locale, namespace: 'sitemapPage.meta' });
    
    return {
        title: t('title'),
        description: t('description'),
    };
}

export default function SitemapLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
