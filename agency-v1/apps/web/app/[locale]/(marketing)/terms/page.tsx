import { Metadata } from "next";
import { TermsContent } from "./terms-content";
import { getTranslations } from "next-intl/server";

interface Props {
    params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { locale } = await params;
    
    const title = "Términos y Condiciones | LegacyMark - Agencia Performance ROI";
    const description = "Conoce los términos y condiciones de servicio en LegacyMark BIC S.A.S. Aquí detallamos los derechos, obligaciones y alcance de nuestra agencia de marketing.";

    return {
        title,
        description,
        alternates: {
            canonical: `/${locale}/terms`,
        },
        openGraph: {
            title,
            description,
            type: "website",
            url: `https://legacymarksas.com/${locale}/terms`,
            siteName: "LegacyMark",
        },
        twitter: {
            card: "summary_large_image",
            title,
            description,
        },
    };
}

export default async function TermsPage() {
    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "WebPage",
        "name": "Términos y Condiciones | LegacyMark",
        "description": "Términos y Condiciones de Servicio de LegacyMark BIC S.A.S",
        "publisher": {
            "@type": "Organization",
            "name": "LegacyMark BIC S.A.S",
            "logo": {
                "@type": "ImageObject",
                "url": "https://legacymarksas.com/logo.png"
            }
        },
        "datePublished": "2026-02-12T08:00:00+00:00",
        "dateModified": "2026-02-12T08:00:00+00:00",
        "breadcrumb": {
            "@type": "BreadcrumbList",
            "itemListElement": [
                {
                    "@type": "ListItem",
                    "position": 1,
                    "name": "Inicio",
                    "item": "https://legacymarksas.com/"
                },
                {
                    "@type": "ListItem",
                    "position": 2,
                    "name": "Términos y Condiciones",
                    "item": "https://legacymarksas.com/terms"
                }
            ]
        }
    };

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            <TermsContent />
        </>
    );
}
