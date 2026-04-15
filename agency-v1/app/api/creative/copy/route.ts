import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextRequest, NextResponse } from 'next/server';
import { db as prisma } from '@/lib/db';
import { auth } from '@/lib/auth';
import { put } from '@vercel/blob';

// ─── PLATFORM COPY SPECS ─────────────────────────────────────────────────────

interface MetaCopy {
    headline: string;          // max 40 chars
    primaryText: string;       // max 125 chars
    description: string;       // max 30 chars
    callToAction: string;
}

interface TikTokCopy {
    hook: string;              // 3-second hook (~10 words)
    script: string;            // 15-30 second script
    hashtags: string[];
    callToAction: string;
}

interface LinkedInCopy {
    intro: string;             // max 600 chars
    headline: string;          // max 70 chars (sponsored content)
    body: string;              // professional B2B angle
}

interface GoogleCopy {
    headlines: string[];       // 3-15 headlines, max 30 chars each
    descriptions: string[];    // 2-4 descriptions, max 90 chars each
    sitelinks: string[];
}

export type PlatformCopy = MetaCopy | TikTokCopy | LinkedInCopy | GoogleCopy;

export interface CopyResponse {
    platform: string;
    copy: PlatformCopy;
    variations: PlatformCopy[]; // 2 alternative versions
}

// ─── SYSTEM PROMPTS ──────────────────────────────────────────────────────────

function buildSystemPrompt(platform: string, objective: string, tone: string): string {
    const shared = `You are an expert ad copywriter for ${platform}. 
Objective: ${objective}. Tone: ${tone}. 
Always return ONLY valid JSON. No markdown, no explanations.`;

    const specs: Record<string, string> = {
        FACEBOOK_ADS: `${shared}
Return JSON: { "headline": "(max 40 chars)", "primaryText": "(max 125 chars, benefit-focused)", "description": "(max 30 chars)", "callToAction": "(one phrase)" }`,
        TIKTOK_ADS: `${shared}
Return JSON: { "hook": "(3-second attention grabber, ~10 words)", "script": "(15-30 second script with visual cues in brackets)", "hashtags": ["tag1","tag2","tag3","tag4","tag5"], "callToAction": "(one phrase)" }`,
        LINKEDIN_ADS: `${shared}
Return JSON: { "intro": "(max 600 chars, B2B authority tone, problem-solution-benefit)", "headline": "(max 70 chars, professional)", "body": "(professional insight with data or stat)" }`,
        GOOGLE_ADS: `${shared}
Return JSON: { "headlines": ["(max 30 chars)", ...], "descriptions": ["(max 90 chars)", ...], "sitelinks": ["(short link text)", ...] }
Provide exactly 5 headlines and 3 descriptions.`,
    };

    return specs[platform] ?? shared;
}

// ─── HANDLER ─────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const {
            platform,
            product,
            objective = 'Generate leads and drive conversions',
            tone = 'professional and compelling',
            audience = 'business owners and marketers',
            brandName = '',
            campaignId,
        }: {
            platform: string;
            product: string;
            objective?: string;
            tone?: string;
            audience?: string;
            brandName?: string;
            campaignId?: string;
        } = await req.json();

        if (!platform || !product) {
            return NextResponse.json({ error: 'platform and product are required' }, { status: 400 });
        }

        const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
        if (!apiKey) return NextResponse.json({ error: 'GOOGLE_GENERATIVE_AI_API_KEY not configured' }, { status: 503 });

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

        const systemPrompt = buildSystemPrompt(platform, objective, tone);
        const userPrompt = `Product/Service: "${product}". Brand: "${brandName || 'the brand'}". Target audience: ${audience}.
Generate the main copy AND 2 alternative variations. 
Return JSON: { "copy": {...}, "variations": [{...}, {...}] }`;

        const result = await model.generateContent([systemPrompt, userPrompt]);
        const text = result.response.text().trim();

        // Strip markdown fences if present
        const cleaned = text.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();
        const parsed = JSON.parse(cleaned) as { copy: PlatformCopy; variations: PlatformCopy[] };

        return NextResponse.json({
            success: true,
            platform,
            copy: parsed.copy,
            variations: parsed.variations ?? [],
        } satisfies CopyResponse & { success: boolean });

    } catch (err: unknown) {
        console.error('[creative/copy]', err);
        const message = err instanceof Error ? err.message : 'Internal server error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
