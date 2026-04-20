import { Metadata } from "next";
import { PrivacyPolicyContent } from "./privacy-content";
import { getTranslations } from "next-intl/server";

interface Props {
    params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: "metadata" });

    // Fallback strings if translation keys don't exist yet
    // The audit suggested a longer, more descriptive title and description.
    const title = "Política de Privacidad | LegacyMark - Agencia Performance ROI";
    const description = "Consulta nuestra política de privacidad. En LegacyMark BIC S.A.S protegemos tus datos y garantizamos transparencia en el tratamiento de información legal.";

    return {
        title,
        description,
        alternates: {
            canonical: `/${locale}/politica-privacidad`,
        },
        openGraph: {
            title,
            description,
            type: "website",
            url: `https://legacymarksas.com/${locale}/politica-privacidad`,
            siteName: "LegacyMark",
        },
        twitter: {
            card: "summary_large_image",
            title,
            description,
        },
    };
}

export default async function PrivacyPolicyPage() {
    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "WebPage",
        "name": "Política de Privacidad | LegacyMark",
        "description": "Política de Privacidad y Tratamiento de Datos de LegacyMark BIC S.A.S",
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
                    "name": "Política de Privacidad",
                    "item": "https://legacymarksas.com/politica-privacidad"
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
            <PrivacyPolicyContent />
        </>
    );
}
