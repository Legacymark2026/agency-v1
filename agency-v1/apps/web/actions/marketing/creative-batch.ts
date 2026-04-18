"use server";

import { generateImageAsset } from "./creative-assets";
import { db as prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export type BatchVariationStyle = "MINIMALIST" | "BOLD" | "LIFESTYLE" | "TYPOGRAPHIC" | "CINEMATIC";

const STYLE_DESCRIPTORS: Record<BatchVariationStyle, string> = {
    MINIMALIST: "clean white background, minimal design, Swiss typography, lots of white space, elegant",
    BOLD: "high contrast, vivid neon colors, strong typography, energetic, loud, eye-catching",
    LIFESTYLE: "natural light, real people lifestyle, candid photography, warm tones, authentic",
    TYPOGRAPHIC: "text-forward design, creative typography as the main visual element, editorial layout",
    CINEMATIC: "cinematic wide shot, dramatic lighting, film noir palette, movie poster aesthetic",
};

/**
 * Generates N style variations of the same creative brief simultaneously.
 */
export async function generateBatchVariations(params: {
    basePrompt: string;
    campaignId?: string;
    platform: string;
    aspectRatio: "1:1" | "9:16" | "16:9" | "4:5";
    styles?: BatchVariationStyle[];
}) {
    const styles = params.styles ?? ["MINIMALIST", "BOLD", "LIFESTYLE", "TYPOGRAPHIC", "CINEMATIC"];

    const results = await Promise.allSettled(
        styles.map((style) =>
            generateImageAsset({
                campaignId: params.campaignId,
                prompt: `${params.basePrompt}. Visual style: ${STYLE_DESCRIPTORS[style]}`,
                aspectRatio: params.aspectRatio,
                platform: params.platform,
                style,
            })
        )
    );

    return results.map((r, i) => ({
        style: styles[i],
        success: r.status === "fulfilled",
        url: r.status === "fulfilled" ? r.value.url : undefined,
        assetId: r.status === "fulfilled" ? r.value.assetId : undefined,
        error: r.status === "rejected" ? String(r.reason) : undefined,
    }));
}

/**
 * Generate a complete creative brief from a single natural-language description.
 * Uses Gemini Flash to produce copy + image prompt + platform specs.
 */
export async function generateCreativeBrief(description: string, platforms: string[]) {
    const { generateText } = await import("ai");
    const { google } = await import("@ai-sdk/google");

    const platformList = platforms.join(", ");

    const { text } = await generateText({
        model: google("gemini-2.0-flash"),
        prompt: `You are a senior creative director at a performance marketing agency.

A client says: "${description}"

Generate a complete creative brief in JSON format with:
{
  "imagePrompt": "A Gemini Imagen photorealistic prompt for an ad image (detailed, 2-3 sentences)",
  "headline": "Main ad headline (max 40 chars)",
  "subheadline": "Supporting text (max 80 chars)", 
  "cta": "Call-to-action button text (max 15 chars)",
  "copy": {
    ${platforms.map(p => `"${p}": "Platform-optimized ad copy for ${p} (2-3 sentences, include hashtags for social)"`).join(',\n    ')}
  },
  "colorPalette": ["#hex1", "#hex2", "#hex3"],
  "tone": "professional|playful|urgent|inspirational",
  "targetAudience": "brief description"
}

Return ONLY the JSON, no markdown.`,
    });

    try {
        return { success: true, brief: JSON.parse(text) };
    } catch {
        return { success: false, error: "Failed to parse brief from AI", raw: text };
    }
}

/**
 * Auto-scale an asset URL to all standard ad formats using a crop/resize instruction set.
 * In production this would call an image processing API (Cloudinary / Sharp).
 * Here we return the mapping format specs for client-side rendering.
 */
export async function generateExportKit(assetId: string) {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };

    const asset = await prisma.campaignAsset.findUnique({
        where: { id: assetId },
        select: { url: true, name: true, width: true, height: true },
    });

    if (!asset) return { success: false, error: "Asset not found" };

    const FORMATS = [
        { name: "Instagram Feed",      ratio: "1:1",    w: 1080, h: 1080, platform: "Instagram" },
        { name: "Instagram Stories",   ratio: "9:16",   w: 1080, h: 1920, platform: "Instagram" },
        { name: "Facebook Feed",       ratio: "1.91:1", w: 1200, h: 628,  platform: "Facebook" },
        { name: "LinkedIn Banner",     ratio: "1.91:1", w: 1200, h: 627,  platform: "LinkedIn" },
        { name: "TikTok Vertical",     ratio: "9:16",   w: 1080, h: 1920, platform: "TikTok" },
        { name: "Google Display",      ratio: "1.91:1", w: 1200, h: 628,  platform: "Google" },
        { name: "Google Responsive",   ratio: "1:1",    w: 300,  h: 300,  platform: "Google" },
        { name: "Twitter/X Card",      ratio: "16:9",   w: 1200, h: 675,  platform: "Twitter" },
        { name: "YouTube Thumbnail",   ratio: "16:9",   w: 1280, h: 720,  platform: "YouTube" },
    ];

    // In production: call Cloudinary/Sharp for real crops.
    // For now return format specs + original URL with crop params.
    const kit = FORMATS.map(f => ({
        ...f,
        url: asset.url,
        downloadUrl: `${asset.url}?w=${f.w}&h=${f.h}&fit=crop`,
        spec: `${f.w}×${f.h}px · ${f.ratio}`,
    }));

    return { success: true, assetName: asset.name, kit };
}
