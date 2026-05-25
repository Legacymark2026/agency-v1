import { getTranslations } from "next-intl/server";

export async function generateMetadata() {
    const t = await getTranslations('portfolioPage.meta');
    return {
        title: t('title'),
        description: t('description'),
    };
}

export default function PortfolioLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
