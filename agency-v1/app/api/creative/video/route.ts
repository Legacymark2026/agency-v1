import { NextRequest, NextResponse } from 'next/server';
import { db as prisma } from '@/lib/db';
import { auth } from '@/lib/auth';
import { put } from '@vercel/blob';

// ─── VEO 2 CONFIG ─────────────────────────────────────────────────────────────

const VEO_ENDPOINT = (projectId: string) =>
    `https://us-central1-aiplatform.googleapis.com/v1/projects/${projectId}/locations/us-central1/publishers/google/models/veo-2.0-generate-001:generateVideo`;

// Platform video hints
const PLATFORM_VIDEO_PROMPTS: Record<string, string> = {
    TIKTOK_ADS: 'fast cuts, energetic transitions, synchronized audio beats, vertical 9:16, Gen-Z aesthetic',
    FACEBOOK_ADS: 'engaging story format, clear value proposition in first 3 seconds, captions visible',
    INSTAGRAM: 'visually stunning, lifestyle focused, smooth transitions, Reels format',
    LINKEDIN_ADS: 'professional tone, business insight focused, clean transitions',
    GOOGLE_ADS: 'product showcase, benefit-driven, clear brand at end card',
};

// ─── STUB MODE (when Veo is not configured) ──────────────────────────────────

function stubVideoResponse(campaignId: string | undefined) {
    return {
        success: true,
        mode: 'stub',
        message: 'Veo 2 not configured. Set GOOGLE_CLOUD_PROJECT_ID to enable AI video generation.',
        url: null,
        assetId: null,
        hint: 'You can still upload videos manually in the Asset Gallery.',
    };
}

// ─── HANDLER ─────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const {
            campaignId,
            script,
            referenceImageUrl,
            duration = 10,
            aspectRatio = '9:16',
            platform = 'TIKTOK_ADS',
            style = 'cinematic',
        }: {
            campaignId?: string;
            script?: string;
            referenceImageUrl?: string;
            duration?: 6 | 10 | 15;
            aspectRatio?: '9:16' | '16:9' | '1:1';
            platform?: string;
            style?: string;
        } = await req.json();

        const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;

        // ── Stub mode if Veo not configured ─────────────────────────────────
        if (!projectId) {
            return NextResponse.json(stubVideoResponse(campaignId));
        }

        // ── Get Google Cloud access token ────────────────────────────────────
        const serviceAccountJson = process.env.GOOGLE_CLOUD_SERVICE_ACCOUNT;
        if (!serviceAccountJson) {
            return NextResponse.json({ error: 'GOOGLE_CLOUD_SERVICE_ACCOUNT not configured' }, { status: 503 });
        }

        // For simplicity, use fetch with service account JWT (full impl would use google-auth-library)
        // In production: `const auth = new GoogleAuth(); const client = await auth.getClient();`
        const accessToken = 'REQUIRES_GOOGLE_AUTH_LIBRARY'; // Placeholder

        const platformHint = PLATFORM_VIDEO_PROMPTS[platform] ?? '';
        const enrichedPrompt = [
            script ?? 'Product advertisement showcasing key benefits',
            platformHint,
            `Style: ${style}.`,
            `Duration: ${duration} seconds.`,
            'High production quality. No watermarks. Commercial use ready.',
        ].filter(Boolean).join(' ');

        const body: Record<string, unknown> = {
            prompt: { text: enrichedPrompt },
            generationConfig: {
                durationSeconds: duration,
                ...(aspectRatio && { aspectRatio }),
            },
        };

        if (referenceImageUrl) {
            body.referenceImages = [{ imageUri: referenceImageUrl }];
        }

        const veoRes = await fetch(VEO_ENDPOINT(projectId), {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });

        if (!veoRes.ok) {
            const errText = await veoRes.text();
            return NextResponse.json({ error: `Veo API error: ${errText}` }, { status: veoRes.status });
        }

        const veoData = await veoRes.json() as { videoUri?: string; predictions?: { videoUri: string }[] };
        const videoUri = veoData.videoUri ?? veoData.predictions?.[0]?.videoUri;

        if (!videoUri) {
            return NextResponse.json({ error: 'Veo did not return a video URI' }, { status: 500 });
        }

        // ── Fetch video bytes and upload to Blob ─────────────────────────────
        const videoRes = await fetch(videoUri);
        const videoBuffer = Buffer.from(await videoRes.arrayBuffer());
        const filename = `creative-video-${Date.now()}-${aspectRatio.replace(':', 'x')}.mp4`;

        const blob = await put(filename, videoBuffer, {
            access: 'public',
            contentType: 'video/mp4',
        });

        // ── Persist CampaignAsset ────────────────────────────────────────────
        let asset = null;
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
                        type: 'VIDEO',
                        url: blob.url,
                        mimeType: 'video/mp4',
                    },
                });
            }
        }

        return NextResponse.json({
            success: true,
            url: blob.url,
            assetId: asset?.id,
            duration,
            aspectRatio,
        });

    } catch (err: unknown) {
        console.error('[creative/video]', err);
        const message = err instanceof Error ? err.message : 'Internal server error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
