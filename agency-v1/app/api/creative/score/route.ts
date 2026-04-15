import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

interface ScoreResult {
    overall: number;
    clarity: number;
    urgency: number;
    benefit: number;
    culturalFit: number;
    feedback: string;
    suggestions: string[];
}

export async function POST(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { copy, platform, language = 'es' }: { copy: Record<string, string>; platform: string; language?: string } = await req.json();

        const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
        if (!apiKey) return NextResponse.json({ error: 'GOOGLE_GENERATIVE_AI_API_KEY not configured' }, { status: 503 });

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

        const copyText = Object.entries(copy).map(([k, v]) => `${k}: ${v}`).join('\n');

        const prompt = `You are an expert ad copy analyst. Evaluate this ${platform} copy and return ONLY valid JSON with no markdown.

Copy to evaluate (language: ${language}):
${copyText}

Score each dimension from 1-10:
- clarity: Is the message clear and easy to understand?
- urgency: Does it create a sense of urgency or FOMO?
- benefit: Is the user benefit clear and compelling?
- culturalFit: Is tone/language appropriate for the target market?
- overall: Weighted average of the above.

Also provide:
- feedback: 1-2 sentence overall assessment (same language as copy)
- suggestions: Array of 3 specific improvement suggestions (same language as copy)

Return JSON: { "overall": 7.5, "clarity": 8, "urgency": 6, "benefit": 9, "culturalFit": 7, "feedback": "...", "suggestions": ["...", "...", "..."] }`;

        const result = await model.generateContent(prompt);
        const text = result.response.text().trim().replace(/^```json\s*/i, '').replace(/\s*```$/i, '');
        const scores = JSON.parse(text) as ScoreResult;

        return NextResponse.json({ success: true, ...scores });
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Internal error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
