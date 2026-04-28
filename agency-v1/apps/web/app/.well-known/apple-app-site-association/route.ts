import { NextResponse } from "next/server";
import { siteConfig } from "@/lib/site-config";

/**
 * /.well-known/apple-app-site-association
 * Canonical path Apple devices check for Universal Links.
 * Mirrors /apple-app-site-association
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
