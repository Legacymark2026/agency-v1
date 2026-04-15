import { NextRequest, NextResponse } from "next/server";
import { getSystemIntegrationConfig } from "@/lib/integration-config-service";
import { auth } from "@/lib/auth";

export async function GET(
    req: NextRequest,
    props: { params: Promise<{ id: string }> }
) {
    const session = await auth();
    if (!session?.user) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    const { id: mediaId } = await props.params;

    if (!mediaId) {
        return new NextResponse("Missing media ID", { status: 400 });
    }

    let apiToken = process.env.WHATSAPP_API_TOKEN || '';
    const config = await getSystemIntegrationConfig('whatsapp');
    if (config?.accessToken) {
        apiToken = config.accessToken;
    }

    if (!apiToken) {
        return new NextResponse("WhatsApp Integration not configured", { status: 501 });
    }

    try {
        // Step 1: Get media URL from Meta Graph
        const metaRes = await fetch(`https://graph.facebook.com/v19.0/${mediaId}`, {
            headers: {
                'Authorization': `Bearer ${apiToken}`
            }
        });

        const metaData = await metaRes.json();

        if (!metaRes.ok || !metaData.url) {
            console.error("Failed to get media URL from Meta:", metaData);
            return new NextResponse("Failed to resolve media URL", { status: 502 });
        }

        // Step 2: Download the binary data
        const mediaRes = await fetch(metaData.url, {
            headers: {
                'Authorization': `Bearer ${apiToken}`
            }
            // `fetch` uses node stream internally which NextResponse can consume directly
        });

        if (!mediaRes.ok) {
            console.error("Failed to download media binary from Meta:", await mediaRes.text());
            return new NextResponse("Failed to download media binary", { status: 502 });
        }

        // Step 3: Stream it back to the client
        const headers = new Headers();
        const contentType = mediaRes.headers.get("Content-Type");
        if (contentType) {
            headers.set("Content-Type", contentType);
        }
        headers.set("Cache-Control", "public, max-age=31536000, immutable");

        return new NextResponse(mediaRes.body, {
            status: 200,
            headers,
        });

    } catch (error) {
        console.error("WhatsApp Media Proxy Error:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
