'use server';

import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

async function getCompanyId(): Promise<string | null> {
  const session = await auth();
  if (!session?.user?.id) return null;
  const cu = await prisma.companyUser.findFirst({
    where: { userId: session.user.id },
    select: { companyId: true },
  });
  return cu?.companyId ?? null;
}

export interface RenderJobInput {
  timeline: any;
  colorGrades: any[];
  audioTracks: any[];
  textOverlays: any[];
  config: any;
}

export async function createRenderJob(
  projectId: string,
  inputData: RenderJobInput,
): Promise<{ jobId: string }> {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  const companyId = await getCompanyId();
  if (!companyId) throw new Error('Company not found');

  // Crear el job en DB como PENDING
  const job = await prisma.videoRenderJob.create({
    data: {
      companyId,
      projectId,
      inputData: inputData as any,
      status: 'PENDING',
      progress: 0,
    },
  });

  // Disparar al video-service en background (fire-and-forget)
  const videoServiceUrl = process.env.VIDEO_SERVICE_URL ?? 'http://localhost:4007';

  fetch(`${videoServiceUrl}/api/video/render`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jobId: job.id,
      companyId,
      projectId,
      ...inputData,
    }),
  }).catch(err => console.error('[video-service] dispatch error:', err));

  return { jobId: job.id };
}

export async function getRenderJobStatus(jobId: string): Promise<{
  status: string;
  progress: number;
  outputUrl: string | null;
  errorMessage: string | null;
} | null> {
  const companyId = await getCompanyId();
  if (!companyId) return null;

  const job = await prisma.videoRenderJob.findFirst({
    where: { id: jobId, companyId },
    select: { status: true, progress: true, outputUrl: true, errorMessage: true },
  });

  return job ?? null;
}

export async function getRenderJobs(projectId: string) {
  const companyId = await getCompanyId();
  if (!companyId) return [];

  return prisma.videoRenderJob.findMany({
    where: { projectId, companyId },
    orderBy: { createdAt: 'desc' },
    take: 10,
    select: {
      id: true,
      status: true,
      progress: true,
      outputUrl: true,
      errorMessage: true,
      createdAt: true,
      completedAt: true,
      durationMs: true,
    },
  });
}
