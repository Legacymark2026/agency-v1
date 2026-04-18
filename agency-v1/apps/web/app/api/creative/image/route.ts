import { GoogleGenerativeAI } from '@google/generative-ai';
import { put } from '@vercel/blob';
import { NextRequest, NextResponse } from 'next/server';
import { db as prisma } from '@/lib/db';
import { auth } from '@/lib/auth';

// ─── DIMENSIONS MAP ──────────────────────────────────────────────────────────

const DIMENSION_MAP = {
    '1:1': { width: 1080, height: 1080 },   // Feed
    '9:16': { width: 1080, height: 1920 },   // Stories / Reels / TikTok
    '16:9': { width: 1920, height: 1080 },   // YouTube / Banner
    '4:5': { width: 1080, height: 1350 },   // Meta Feed (optimized)
    '1.91:1': { width: 1200, height: 628 },  // Google Display / OG
} as const;

type AspectRatio = keyof typeof DIMENSION_MAP;

// ─── HANDLER ─────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const {
            campaignId,
            prompt,
            aspectRatio = '1:1',
            platform = 'FACEBOOK_ADS',
            style = 'photorealistic',
            brandColors = [],
            brandName = '',
        }: {
            campaignId?: string;
            prompt: string;
            aspectRatio?: AspectRatio;
            platform?: string;
            style?: string;
            brandColors?: string[];
            brandName?: string;
        } = await req.json();

        if (!prompt) return NextResponse.json({ error: 'prompt is required' }, { status: 400 });

        const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
        if (!apiKey) return NextResponse.json({ error: 'GOOGLE_GENERATIVE_AI_API_KEY not configured' }, { status: 503 });

        const dims = DIMENSION_MAP[aspectRatio] ?? DIMENSION_MAP['1:1'];

        // ── Build enriched prompt ────────────────────────────────────────────
        const platformHints: Record<string, string> = {
            FACEBOOK_ADS: 'optimized for Facebook and Instagram Feed with bold visuals and clear focal point',
            GOOGLE_ADS: 'clean, high-contrast design suitable for Google Display banners',
            TIKTOK_ADS: 'vibrant, energetic and youth-oriented, suitable for TikTok video thumbnail',
            LINKEDIN_ADS: 'professional, corporate tone with clean modern design for LinkedIn',
        };

        const colorHint = brandColors.length > 0
            ? `Brand colors to use: ${brandColors.join(', ')}.`
            : '';
        const brandHint = brandName ? `Brand name: ${brandName}.` : '';
        const platformHint = platformHints[platform] ?? '';

        const enrichedPrompt = [
            prompt,
            brandHint,
            colorHint,
            platformHint,
            `Style: ${style}.`,
            `Image dimensions: ${dims.width}x${dims.height} pixels, aspect ratio ${aspectRatio}.`,
            'No watermarks. Commercial use ready.',
        ].filter(Boolean).join(' ');

        // ── Call Gemini Imagen 3 ─────────────────────────────────────────────
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: 'imagen-3.0-generate-001' });

        // @ts-ignore — generateImages is on the ImageGenerationModel
        const result = await model.generateImages({
            prompt: enrichedPrompt,
            number_of_images: 1,
            aspect_ratio: aspectRatio,
        });

        // @ts-ignore
        const imageBytes = result.images[0].imageBytes as string; // base64
        const buffer = Buffer.from(imageBytes, 'base64');
        const mimeType = 'image/png';

        // ── Upload to Vercel Blob ────────────────────────────────────────────
        const filename = `creative-${Date.now()}-${aspectRatio.replace(':', 'x')}.png`;
        const blob = await put(filename, buffer, {
            access: 'public',
            contentType: mimeType,
        });

        // ── Persist CampaignAsset ────────────────────────────────────────────
        let asset: any = null;
        if (campaignId) {
            const companyUser = await prisma.companyUser.findFirst({
                where: { userId: session.user.id },
                select: { companyId: true },
            });

            if (companyUser) {
                asset = await prisma.campaignAsset.create({
                    data: {
                        campaignId,
                        companyId: companyUser.companyId,
                        type: 'IMAGE',
                        url: blob.url,
                        mimeType,
                        width: dims.width,
                        height: dims.height,
                    },
                });
            }
        }

        return NextResponse.json({
            success: true,
            url: blob.url,
            assetId: asset?.id,
            dimensions: dims,
            aspectRatio,
        });

    } catch (err: unknown) {
        console.error('[creative/image]', err);
        const message = err instanceof Error ? err.message : 'Internal server error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

