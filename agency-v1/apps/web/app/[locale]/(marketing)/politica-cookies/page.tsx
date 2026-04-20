import { Metadata } from "next";
import { CookiesPolicyContent } from "./cookies-content";
import { getTranslations } from "next-intl/server";

interface Props {
    params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { locale } = await params;
    
    const title = "Política de Cookies | LegacyMark - Transparencia y Privacidad";
    const description = "Conoce qué son las cookies, cómo las usamos en LegacyMark y cómo puedes gestionarlas. Garantizamos transparencia en el tratamiento de tus datos.";

    return {
        title,
        description,
        alternates: {
            canonical: `/${locale}/politica-cookies`,
        },
        openGraph: {
            title,
            description,
            type: "website",
            url: `https://legacymarksas.com/${locale}/politica-cookies`,
            siteName: "LegacyMark",
        },
        twitter: {
            card: "summary_large_image",
            title,
            description,
        },
    };
}

export default async function CookiesPolicyPage() {
    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "WebPage",
        "name": "Política de Cookies | LegacyMark",
        "description": "Política de Cookies de LegacyMark BIC S.A.S",
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
                    "name": "Cookies",
                    "item": "https://legacymarksas.com/politica-cookies"
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
            <CookiesPolicyContent />
        </>
    );
}
