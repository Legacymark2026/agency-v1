import { NextResponse } from "next/server";
import { siteConfig } from "@/lib/site-config";

export async function GET() {
    const baseUrl = siteConfig.url.endsWith("/")
        ? siteConfig.url.slice(0, -1)
        : siteConfig.url;

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>${baseUrl}/sitemap.xml</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
  </sitemap>
</sitemapindex>`;

    return new NextResponse(xml, {
        headers: {
            "Content-Type": "application/xml; charset=utf-8",
            "Cache-Control": "public, max-age=86400, s-maxage=86400",
        },
    });
}
