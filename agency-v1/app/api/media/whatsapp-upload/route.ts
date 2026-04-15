import { NextRequest, NextResponse } from "next/server";
import { getSystemIntegrationConfig } from "@/lib/integration-config-service";
import { auth } from "@/lib/auth";

export async function POST(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const formData = await req.formData();
        const file = formData.get("file") as File | null;

        if (!file) {
            return new NextResponse("Missing file", { status: 400 });
        }

        let apiToken = process.env.WHATSAPP_API_TOKEN || '';
        let phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID || '';

        const config = await getSystemIntegrationConfig('whatsapp');
        if (config?.accessToken) apiToken = config.accessToken;
        if (config?.phoneNumberId) phoneNumberId = config.phoneNumberId;

        if (!apiToken || !phoneNumberId) {
            return new NextResponse("WhatsApp Integration not configured", { status: 501 });
        }

        // WhatsApp requires specific mime types and extensions for audio.
        // We ensure it's sent as an audio type that WhatsApp accepts (audio/mp4 or audio/aac or audio/mpeg or audio/ogg)
        // MediaRecorder defaults to audio/webm which is sometimes rejected, but let's try sending it directly or specifying audio/mp4.

        // WhatsApp is strict about extensions matching MIME types.
        let extension = 'mp4';
        if (file.type.includes('ogg')) extension = 'ogg';
        else if (file.type.includes('webm')) extension = 'ogg'; // WhatsApp prefers ogg over webm for audio
        else if (file.type.includes('mpeg')) extension = 'mp3';
        else if (file.type.includes('audio/aac')) extension = 'aac';
        
        const fileName = `audio_${Date.now()}.${extension}`;

        const metaFormData = new FormData();
        metaFormData.append('messaging_product', 'whatsapp');
        // We append the raw blob as file with a corrected extension
        metaFormData.append('file', file, fileName);

        const uploadUrl = `https://graph.facebook.com/v19.0/${phoneNumberId}/media`;

        const response = await fetch(uploadUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiToken}`
                // Note: fetch will automatically set the Content-Type to multipart/form-data with correct boundary
            },
            body: metaFormData as any
        });

        const data = await response.json();

        if (!response.ok) {
            console.error("WhatsApp Media Upload Error:", data);
            return NextResponse.json({ error: data.error?.message || "Failed to upload to Meta" }, { status: response.status });
        }

        // Returns { id: "123456789" }
        return NextResponse.json(data);

    } catch (error) {
        console.error("WhatsApp Media Proxy Upload Error:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
