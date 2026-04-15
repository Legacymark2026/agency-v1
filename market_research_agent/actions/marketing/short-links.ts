"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export type CreateShortLinkParams = {
    companyId: string;
    destinationUrl: string;
    utmSource?: string;
    utmMedium?: string;
    utmCampaign?: string;
};

function generateSlug(length: number = 6) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

export async function createShortLinkAction(params: CreateShortLinkParams) {
    try {
        if (!params.companyId || !params.destinationUrl) {
            return { success: false, error: "CompanyId and Destination URL are required" };
        }

        // 1. Validar si la URL ya tiene UTMs o si hay que construirlas
        let finalUrl = params.destinationUrl;
        
        try {
            const urlObj = new URL(finalUrl);
            if (params.utmSource) urlObj.searchParams.set("utm_source", params.utmSource);
            if (params.utmMedium)  urlObj.searchParams.set("utm_medium", params.utmMedium);
            if (params.utmCampaign) urlObj.searchParams.set("utm_campaign", params.utmCampaign);
            finalUrl = urlObj.toString();
        } catch (e) {
            return { success: false, error: "Invalid URL format" };
        }

        // 2. Generar Slug único
        let slug = generateSlug();
        let exists = await prisma.shortLink.findUnique({ where: { slug } });
        while (exists) {
            slug = generateSlug();
            exists = await prisma.shortLink.findUnique({ where: { slug } });
        }

        // 3. Crear en Base de Datos
        const link = await prisma.shortLink.create({
            data: {
                companyId: params.companyId,
                slug,
                destinationUrl: finalUrl,
                utmSource: params.utmSource || null,
                utmMedium: params.utmMedium || null,
                utmCampaign: params.utmCampaign || null,
            }
        });

        // Retornar la URL corta final
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
        const shortUrl = `${baseUrl}/l/${slug}`;

        return { success: true, data: { shortUrl, link } };

    } catch (error: any) {
        console.error("Error creating short link:", error);
        return { success: false, error: error.message || "Failed to create short link" };
    }
}
