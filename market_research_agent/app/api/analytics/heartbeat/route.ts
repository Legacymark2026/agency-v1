import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
    try {
        let body;
        try {
            body = await request.json();
        } catch (e) {
            return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
        }
        const { sessionId, duration, scrollDepth, eventId } = body;

        if (!sessionId) {
            return NextResponse.json(
                { error: 'Missing sessionId' },
                { status: 400 }
            );
        }

        // Update session duration
        await prisma.analyticsSession.update({
            where: { id: sessionId },
            data: {
                duration: Math.max(duration || 0, 0),
                isActive: true,
            },
        });

        // Update event scroll depth if provided
        if (eventId && scrollDepth !== undefined) {
            await prisma.analyticsEvent.update({
                where: { id: eventId },
                data: {
                    scrollDepth: Math.min(Math.max(scrollDepth, 0), 100),
                    duration: duration || 0,
                },
            });
        }

        return NextResponse.json({ success: true });

    } catch (error: any) {
        // Ignore "Record to update not found" errors (P2025)
        if (error.code === 'P2025') {
            return NextResponse.json({ success: true, warning: 'Session not found' });
        }

        console.error('Heartbeat error:', error);
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
