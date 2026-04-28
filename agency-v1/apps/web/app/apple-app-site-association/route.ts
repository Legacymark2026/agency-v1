import { NextResponse } from "next/server";
import { siteConfig } from "@/lib/site-config";

/**
 * Apple App Site Association file
 * Used by iOS/macOS for Universal Links and Handoff.
 * Since LegacyMark does not have a native iOS app, we return a valid
 * empty structure so crawlers and Apple devices don't get a 404.
 */
export async function GET() {
    const payload = {
        applinks: {
            apps: [],
            details: [],
        },
        webcredentials: {
            apps: [],
        },
    };

    return NextResponse.json(payload, {
        headers: {
            "Content-Type": "application/json",
            "Cache-Control": "public, max-age=86400, s-maxage=86400",
        },
    });
}
