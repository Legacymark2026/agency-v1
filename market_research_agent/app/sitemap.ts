import { MetadataRoute } from "next";
import { siteConfig } from "@/lib/site-config";
import { getAllPosts } from "@/lib/data";
import { routing } from "@/i18n/routing";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const posts = await getAllPosts();

    const staticRoutes = [
        "",
        "/servicios",
        "/soluciones/automatizacion",
        "/soluciones/web-dev",
        "/portfolio",
        "/metodologia",
        "/blog",
        "/contacto",
        "/nosotros",
        "/privacy",
        "/terms",
    ];

    const sitemapEntries: MetadataRoute.Sitemap = [];
    const baseUrl = siteConfig.url.endsWith('/') ? siteConfig.url.slice(0, -1) : siteConfig.url;

    // Helper to build hreflang alternates linking to parallel locale versions
    const buildAlternates = (route: string) => {
        const languages: Record<string, string> = {};

        routing.locales.forEach((locale) => {
            // Basic generic languages
            languages[locale] = `${baseUrl}/${locale}${route}`;

            // Ultra-professional: Map explicit regional targets for US and Spain
            if (locale === 'es') {
                languages['es-ES'] = `${baseUrl}/${locale}${route}`; // Spain
                languages['es-US'] = `${baseUrl}/${locale}${route}`; // USA (Hispanic)
            }
            if (locale === 'en') {
                languages['en-US'] = `${baseUrl}/${locale}${route}`; // USA (General)
            }
        });

        return { languages };
    };

    // 1. Static Routes across locales
    routing.locales.forEach((locale) => {
        staticRoutes.forEach((route) => {
            sitemapEntries.push({
                url: `${baseUrl}/${locale}${route}`,
                lastModified: new Date(),
                changeFrequency: route === "" ? "daily" : "weekly",
                priority: route === "" ? 1 : 0.8,
                alternates: buildAlternates(route),
            });
        });
    });

    // 2. Dynamic Blog Routes across locales
    posts.forEach((post) => {
        routing.locales.forEach((locale) => {
            const route = `/blog/${post.slug}`;
            sitemapEntries.push({
                url: `${baseUrl}/${locale}${route}`,
                lastModified: (post as any).updatedAt ? new Date((post as any).updatedAt) : new Date(),
                changeFrequency: "weekly",
                priority: 0.6,
                alternates: buildAlternates(route),
            });
        });
    });

    return sitemapEntries;
}
