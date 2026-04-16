import { siteConfig } from "@/lib/site-config";

export function JsonLd({ locale }: { locale: string }) {
    const availableLanguages = locale === 'en' ? ["English", "Spanish"] : ["Spanish", "English"];
    const areaServed = locale === 'en' ? ["US", "CO", "ES"] : ["CO", "ES", "MX", "AR", "PE"];
    const addressCountry = locale === 'en' ? "US" : "CO";

    const organizationJsonLd = {
        "@context": "https://schema.org",
        "@type": ["Organization", "MarketingAgency", "WebDevelopment"],
        "name": siteConfig.name,
        "url": siteConfig.url,
        "logo": `${siteConfig.url}/logo.png`,
        "description": siteConfig.description,
        "foundingDate": "2023",
        "sameAs": [
            siteConfig.links.linkedin,
            siteConfig.links.facebook,
            siteConfig.links.instagram,
            siteConfig.links.whatsapp,
            siteConfig.links.twitter,
            siteConfig.links.github
        ],
        "contactPoint": {
            "@type": "ContactPoint",
            "telephone": "+57-322-3047353",
            "contactType": "sales",
            "areaServed": areaServed,
            "availableLanguage": availableLanguages,
        },
        "address": {
            "@type": "PostalAddress",
            "streetAddress": siteConfig.address.street,
            "addressLocality": siteConfig.address.city,
            "addressRegion": siteConfig.address.department,
            "postalCode": siteConfig.address.postalCode,
            "addressCountry": addressCountry,
        },
        "areaServed": [
            { "@type": "Country", "name": "Colombia" },
            { "@type": "Country", "name": "Spain" },
            { "@type": "Country", "name": "United States" }
        ],
        "priceRange": "$$",
        "serviceType": [
            "Marketing Digital",
            "Desarrollo Web Next.js",
            "Branding",
            "SEO Avanzado",
            "Automatización de Ventas",
            "Publicidad Digital",
            "Growth Hacking",
            "Estrategia de Marca"
        ],
        "hasOfferCatalog": {
            "@type": "OfferCatalog",
            "name": "Servicios de Marketing y Desarrollo",
            "itemListElement": [
                { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Desarrollo Web de Alto Rendimiento" } },
                { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Marketing de Performance (ROI)" } },
                { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "SEO y Posicionamiento Orgánico" } },
                { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Branding y Diseño Identidad" } },
                { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Automatización de Procesos de Ventas" } },
                { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Publicidad Digital (Ads)" } }
            ]
        },
        "inLanguage": locale,
    };

    const localBusinessJsonLd = {
        "@context": "https://schema.org",
        "@type": "MarketingAgency",
        "@id": `${siteConfig.url}/#localbusiness`,
        "name": siteConfig.name,
        "url": siteConfig.url,
        "telephone": "+57-322-3047353",
        "priceRange": "$$",
        "address": {
            "@type": "PostalAddress",
            "streetAddress": siteConfig.address.street,
            "addressLocality": siteConfig.address.city,
            "addressRegion": siteConfig.address.department,
            "postalCode": siteConfig.address.postalCode,
            "addressCountry": "CO",
        },
        "geo": {
            "@type": "GeoCoordinates",
            "latitude": 7.0682,
            "longitude": -73.1698
        },
        "openingHoursSpecification": [
            {
                "@type": "OpeningHoursSpecification",
                "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
                "opens": "08:00",
                "closes": "18:00"
            }
        ],
        "image": `${siteConfig.url}/og.jpg`
    };

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
            />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessJsonLd) }}
            />
        </>
    );
}
