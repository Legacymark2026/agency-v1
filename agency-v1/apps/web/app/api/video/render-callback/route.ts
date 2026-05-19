import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Endpoint interno que llama el video-service cuando un render termina
export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-internal-secret');
  const expectedSecret = process.env.INTERNAL_SECRET ?? 'video-service-secret';

  if (secret !== expectedSecret) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { jobId, status, progress, outputUrl, errorMessage, durationMs } = body;

    if (!jobId) {
      return NextResponse.json({ error: 'Missing jobId' }, { status: 400 });
    }

    await prisma.videoRenderJob.updateMany({
      where: { id: jobId },
      data: {
        status:       status       ?? undefined,
        progress:     progress     ?? undefined,
        outputUrl:    outputUrl    ?? undefined,
        errorMessage: errorMessage ?? undefined,
        durationMs:   durationMs   ?? undefined,
        completedAt:  status === 'COMPLETED' || status === 'FAILED' ? new Date() : undefined,
        startedAt:    status === 'PROCESSING' ? new Date() : undefined,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[render-callback] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
