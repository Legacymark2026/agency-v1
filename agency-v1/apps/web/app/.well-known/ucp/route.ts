import { NextResponse } from "next/server";

/**
 * /.well-known/ucp
 * Used by Universal Control Panel / some security scanners and browser privacy tools.
 * Return a valid empty 200 to suppress 404 noise.
 */
export async function GET() {
    return new NextResponse("", {
        status: 200,
        headers: {
            "Content-Type": "text/plain",
            "Cache-Control": "public, max-age=86400, s-maxage=86400",
        },
    });
}
