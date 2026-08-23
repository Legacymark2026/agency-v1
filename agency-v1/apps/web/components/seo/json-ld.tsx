import { siteConfig } from "@/lib/site-config";

export function JsonLd({ locale }: { locale: string }) {
    const availableLanguages = locale === 'en' ? ["English", "Spanish"] : ["Spanish", "English"];
    const areaServed = locale === 'en' ? ["US", "CO", "ES"] : ["CO", "ES", "MX", "AR", "PE"];
    const addressCountry = locale === 'en' ? "US" : "CO";

    const organizationSchema = {
        "@context": "https://schema.org",
        "@type": ["Organization", "MarketingAgency", "ProfessionalService"],
        "name": siteConfig.name,
        "url": siteConfig.url,
        "logo": `${siteConfig.url}/favicon.ico`,
        "image": siteConfig.ogImage,
        "description": siteConfig.description,
        "foundingDate": "2023",
        "taxID": siteConfig.nit,
        "sameAs": [
            siteConfig.links.linkedin,
            siteConfig.links.facebook,
            siteConfig.links.instagram,
            siteConfig.links.whatsapp
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
        "priceRange": "$$",
        "serviceType": [
            "Marketing Digital",
            "Desarrollo Web",
            "Branding",
            "SEO",
            "Automatización",
            "Publicidad Digital",
            "Creación de Contenido",
            "Estrategia de Marca"
        ],
        "hasOfferCatalog": {
            "@type": "OfferCatalog",
            "name": "Servicios",
            "itemListElement": [
                { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Desarrollo Web" } },
                { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Marketing Digital" } },
                { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "SEO y Posicionamiento" } },
                { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Branding y Diseño" } },
                { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Automatización" } },
                { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Publicidad Digital" } }
            ]
        },
        "inLanguage": locale,
    };

    const breadcrumbsSchema = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
            {
                "@type": "ListItem",
                "position": 1,
                "name": "Inicio",
                "item": siteConfig.url
            },
            {
                "@type": "ListItem",
                "position": 2,
                "name": "Servicios",
                "item": `${siteConfig.url}/servicios`
            },
            {
                "@type": "ListItem",
                "position": 3,
                "name": "Portafolio",
                "item": `${siteConfig.url}/portfolio`
            },
            {
                "@type": "ListItem",
                "position": 4,
                "name": "Blog",
                "item": `${siteConfig.url}/blog`
            },
            {
                "@type": "ListItem",
                "position": 5,
                "name": "Contacto",
                "item": `${siteConfig.url}/contacto`
            }
        ]
    };

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
            />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbsSchema) }}
            />
        </>
    );
}
