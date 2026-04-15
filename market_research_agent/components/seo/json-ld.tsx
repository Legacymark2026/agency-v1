import { siteConfig } from "@/lib/site-config";

export function JsonLd() {
    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "Organization",
        name: siteConfig.name,
        url: siteConfig.url,
        logo: `${siteConfig.url}/logo.png`,
        sameAs: [
            siteConfig.links.twitter,
            siteConfig.links.linkedin,
            siteConfig.links.github,
            siteConfig.links.facebook,
            siteConfig.links.instagram,
        ],
        contactPoint: {
            "@type": "ContactPoint",
            telephone: "+57-322-3047353",
            contactType: "customer service",
            areaServed: ["CO"],
            availableLanguage: ["Spanish"],
        },
        address: {
            "@type": "PostalAddress",
            streetAddress: siteConfig.address.street,
            addressLocality: siteConfig.address.city,
            addressRegion: siteConfig.address.department,
            postalCode: siteConfig.address.postalCode,
            addressCountry: "CO",
        },
    };

    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
    );
}
