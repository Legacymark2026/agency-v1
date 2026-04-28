import { NextResponse } from "next/server";
import { siteConfig } from "@/lib/site-config";

export async function GET() {
    const baseUrl = siteConfig.url.endsWith("/")
        ? siteConfig.url.slice(0, -1)
        : siteConfig.url;

    return NextResponse.redirect(`${baseUrl}/sitemap.xml`, { status: 301 });
}
