import { NextResponse } from "next/server";
import { siteConfig } from "@/lib/site-config";
import { getAllPosts } from "@/lib/data";
import { routing } from "@/i18n/routing";

export async function GET() {
    const posts = await getAllPosts();
    const baseUrl = siteConfig.url.endsWith("/")
        ? siteConfig.url.slice(0, -1)
        : siteConfig.url;

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

    const urls: string[] = [];

    routing.locales.forEach((locale) => {
        staticRoutes.forEach((route) => {
            urls.push(`${baseUrl}/${locale}${route}`);
        });
    });

    posts.forEach((post) => {
        routing.locales.forEach((locale) => {
            urls.push(`${baseUrl}/${locale}/blog/${post.slug}`);
        });
    });

    return new NextResponse(urls.join("\n"), {
        headers: {
            "Content-Type": "text/plain; charset=utf-8",
            "Cache-Control": "public, max-age=86400, s-maxage=86400",
        },
    });
}
