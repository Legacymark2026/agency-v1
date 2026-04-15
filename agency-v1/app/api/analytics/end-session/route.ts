import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
    try {
        const { sessionId } = await request.json();

        if (!sessionId) {
            return NextResponse.json(
                { error: 'Missing sessionId' },
                { status: 400 }
            );
        }

        await prisma.analyticsSession.upsert({
            where: { id: sessionId },
            update: { endedAt: new Date(), isActive: false },
            create: { id: sessionId, endedAt: new Date(), isActive: false, visitorId: "", entryPage: "/dashboard" },
        });

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Session end error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

export async function OPTIONS() {
    return new NextResponse(null, {
        status: 200,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        },
    });
}
