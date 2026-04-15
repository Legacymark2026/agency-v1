interface ArticleSchemaProps {
    title: string;
    description: string;
    url: string;
    imageUrl?: string;
    authorName: string;
    publishedDate: string;
    modifiedDate?: string;
    section?: string; // Category
    tags?: string[];
}

export function ArticleSchema({
    title,
    description,
    url,
    imageUrl,
    authorName,
    publishedDate,
    modifiedDate,
    section,
    tags
}: ArticleSchemaProps) {
    const schema = {
        "@context": "https://schema.org",
        "@type": "Article",
        "headline": title,
        "description": description,
        "url": url,
        "image": imageUrl || undefined,
        "author": {
            "@type": "Person",
            "name": authorName
        },
        "publisher": {
            "@type": "Organization",
            "name": "LegacyMark",
            "logo": {
                "@type": "ImageObject",
                "url": "https://legacymark.com/logo.png"
            }
        },
        "datePublished": publishedDate,
        "dateModified": modifiedDate || publishedDate,
        "mainEntityOfPage": {
            "@type": "WebPage",
            "@id": url
        },
        "articleSection": section,
        "keywords": tags?.join(", ")
    };

    // Remove undefined values
    const cleanSchema = JSON.parse(JSON.stringify(schema));

    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(cleanSchema) }}
        />
    );
}

interface BreadcrumbSchemaProps {
    items: { name: string; url: string }[];
}

export function BreadcrumbSchema({ items }: BreadcrumbSchemaProps) {
    const schema = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": items.map((item, index) => ({
            "@type": "ListItem",
            "position": index + 1,
            "name": item.name,
            "item": item.url
        }))
    };

    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
    );
}

interface FAQSchemaProps {
    questions: { question: string; answer: string }[];
}

export function FAQSchema({ questions }: FAQSchemaProps) {
    const schema = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": questions.map(q => ({
            "@type": "Question",
            "name": q.question,
            "acceptedAnswer": {
                "@type": "Answer",
                "text": q.answer
            }
        }))
    };

    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
    );
}

interface OrganizationSchemaProps {
    name: string;
    url: string;
    logo?: string;
    sameAs?: string[]; // Social media URLs
    description?: string;
}

export function OrganizationSchema({
    name,
    url,
    logo,
    sameAs = [],
    description
}: OrganizationSchemaProps) {
    const schema = {
        "@context": "https://schema.org",
        "@type": "Organization",
        "name": name,
        "url": url,
        "logo": logo,
        "description": description,
        "sameAs": sameAs.length > 0 ? sameAs : undefined
    };

    const cleanSchema = JSON.parse(JSON.stringify(schema));

    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(cleanSchema) }}
        />
    );
}

interface WebSiteSchemaProps {
    name: string;
    url: string;
    searchUrl?: string; // URL template for search, e.g. "https://example.com/search?q={search_term_string}"
}

export function WebSiteSchema({ name, url, searchUrl }: WebSiteSchemaProps) {
    const schema: Record<string, unknown> = {
        "@context": "https://schema.org",
        "@type": "WebSite",
        "name": name,
        "url": url
    };

    if (searchUrl) {
        schema.potentialAction = {
            "@type": "SearchAction",
            "target": {
                "@type": "EntryPoint",
                "urlTemplate": searchUrl
            },
            "query-input": "required name=search_term_string"
        };
    }

    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
    );
}
