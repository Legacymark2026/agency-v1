import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

interface SafetyResult {
    safe: boolean;
    score: number;           // 0–100 safety score
    flags: string[];
    recommendation: 'APPROVED' | 'REVIEW' | 'REJECTED';
    details: string;
}

export async function POST(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { imageUrl }: { imageUrl: string } = await req.json();
        if (!imageUrl) return NextResponse.json({ error: 'imageUrl required' }, { status: 400 });

        const apiKey = process.env.GOOGLE_CLOUD_VISION_API_KEY ?? process.env.GOOGLE_GENERATIVE_AI_API_KEY;

        // ── If Cloud Vision is configured, use it ────────────────────────────
        if (process.env.GOOGLE_CLOUD_VISION_API_KEY) {
            const visionRes = await fetch(
                `https://vision.googleapis.com/v1/images:annotate?key=${process.env.GOOGLE_CLOUD_VISION_API_KEY}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        requests: [{
                            image: { source: { imageUri: imageUrl } },
                            features: [{ type: 'SAFE_SEARCH_DETECTION' }],
                        }],
                    }),
                }
            );

            const data = await visionRes.json() as { responses: Array<{ safeSearchAnnotation: Record<string, string> }> };
            const annotation = data.responses[0]?.safeSearchAnnotation ?? {};

            const RISK_LEVELS: Record<string, number> = {
                VERY_UNLIKELY: 0, UNLIKELY: 1, POSSIBLE: 2, LIKELY: 3, VERY_LIKELY: 4
            };

            const categories = ['adult', 'violence', 'racy', 'medical', 'spoof'] as const;
            const flags: string[] = [];
            let maxRisk = 0;

            categories.forEach((cat) => {
                const val = annotation[cat] ?? 'VERY_UNLIKELY';
                const risk = RISK_LEVELS[val] ?? 0;
                if (risk >= 2) flags.push(`${cat.toUpperCase()}: ${val}`);
                if (risk > maxRisk) maxRisk = risk;
            });

            const score = Math.max(0, 100 - maxRisk * 25);
            const recommendation: SafetyResult['recommendation'] =
                maxRisk >= 3 ? 'REJECTED' : maxRisk >= 2 ? 'REVIEW' : 'APPROVED';

            return NextResponse.json({
                success: true,
                safe: maxRisk < 2,
                score,
                flags,
                recommendation,
                details: flags.length ? `Contenido detectado: ${flags.join(', ')}` : 'Contenido apto para todas las plataformas.',
            } satisfies SafetyResult & { success: boolean });
        }

        // ── Stub mode (no Vision API key) ────────────────────────────────────
        return NextResponse.json({
            success: true,
            safe: true,
            score: 95,
            flags: [],
            recommendation: 'APPROVED',
            details: 'Safety scan no configurado (GOOGLE_CLOUD_VISION_API_KEY). Configúralo para activar el análisis real.',
            stubMode: true,
        });

    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Internal error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
