import { prisma } from "./prisma";
import { createHmac } from "crypto";

/**
 * Valida una API Key y retorna el ID de la compañía asociada.
 */
export async function validateApiKey(apiKey: string | null): Promise<{ companyId: string } | null> {
    if (!apiKey) return null;

    try {
        const keyHash = createHmac("sha256", process.env.API_KEY_SECRET ?? "").update(apiKey).digest("hex");
        const keyRecord = await prisma.apiKey.findFirst({
            where: { keyHash, isActive: true },
            select: { companyId: true, expiresAt: true },
        });

        if (!keyRecord || !keyRecord.companyId) return null;
        if (keyRecord.expiresAt && keyRecord.expiresAt < new Date()) return null;

        return { companyId: keyRecord.companyId };
    } catch (error) {
        console.error("[validateApiKey] Error:", error);
        return null;
    }
}
