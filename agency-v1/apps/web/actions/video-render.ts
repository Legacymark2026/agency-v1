'use server';

import { prisma as prismaDb } from '@/lib/prisma';
import { auth } from '@/lib/auth';

const GATEWAY_URL = process.env.API_GATEWAY_URL || 'http://localhost:8080';
async function gw(path: string, options: RequestInit = {}) {
  const res = await fetch(`${GATEWAY_URL}${path}`, { ...options, headers: { 'Content-Type': 'application/json', ...options.headers } });
  if (!res.ok) { const err = await res.json().catch(() => ({ error: res.statusText })); throw new Error(err.error || `Gateway error ${res.status}`); }
  return res.json();
}

async function getCompanyId(): Promise<string | null> {
  const session = await auth();
  if (!session?.user?.id) return null;
  const cu = await prismaDb.companyUser.findFirst({
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
  const job = await gw('/api/video/render/db-job', {
    method: 'POST',
    body: JSON.stringify({
      companyId,
      projectId,
      inputData,
      status: 'PENDING',
      progress: 0,
    })
  });

  // Disparar al video-service en background (fire-and-forget)
  const videoServiceUrl = process.env.VIDEO_SERVICE_URL ?? 'http://localhost:4007';
  const internalSecret = process.env.INTERNAL_SECRET ?? 'video-service-secret-change-in-production';

  fetch(`${videoServiceUrl}/api/video/render`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-internal-secret': internalSecret,
    },
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

  try {
    const job = await gw(`/api/video/render/db-job/${jobId}`);
    return {
      status: job.status,
      progress: job.progress,
      outputUrl: job.outputUrl,
      errorMessage: job.errorMessage
    };
  } catch {
    return null;
  }
}

export async function getRenderJobs(projectId: string) {
  const companyId = await getCompanyId();
  if (!companyId) return [];

  try {
    const res = await gw(`/api/video/render/history?companyId=${companyId}&projectId=${projectId}`);
    return res.jobs || [];
  } catch {
    return [];
  }
}
