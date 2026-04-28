import { NextResponse } from "next/server";
import { siteConfig } from "@/lib/site-config";

/**
 * meta.json - Web App Manifest variant searched by some crawlers/tools.
 * Returns a minimal app metadata document.
 */
export async function GET() {
    const payload = {
        name: siteConfig.name,
        short_name: siteConfig.name,
        description: siteConfig.description,
        start_url: "/",
        display: "browser",
        theme_color: "#0d9488",
        background_color: "#020617",
        icons: [
            {
                src: "/apple-touch-icon.png",
                sizes: "180x180",
                type: "image/png",
            },
            {
                src: "/favicon-16x16.png",
                sizes: "16x16",
                type: "image/png",
            },
        ],
        related_applications: [],
        prefer_related_applications: false,
    };

    return NextResponse.json(payload, {
        headers: {
            "Content-Type": "application/json",
            "Cache-Control": "public, max-age=86400, s-maxage=86400",
        },
    });
}
