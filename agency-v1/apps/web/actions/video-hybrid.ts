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

export interface EditProposalInput {
  sessionId: string;
  projectId: string;
  type: string;
  title: string;
  description: string;
  confidence: number;
  beforeState: any;
  afterState: any;
  metadata?: any;
}

export async function createEditProposal(
  data: EditProposalInput,
): Promise<{ proposalId: string }> {
  const companyId = await getCompanyId();
  if (!companyId) throw new Error('Unauthorized');

  const res = await gw('/api/video/proposals', {
    method: 'POST',
    body: JSON.stringify(data)
  });
  return { proposalId: res.id };
}

export async function getPendingProposals(
  sessionId: string,
): Promise<any[]> {
  const companyId = await getCompanyId();
  if (!companyId) return [];

  const res = await gw(`/api/video/sessions/${sessionId}/proposals`);
  return res.proposals || [];
}

export async function approveProposal(
  proposalId: string,
): Promise<void> {
  const companyId = await getCompanyId();
  if (!companyId) throw new Error('Unauthorized');

  await gw(`/api/video/proposals/${proposalId}`, {
    method: 'PATCH',
    body: JSON.stringify({ action: 'approve' })
  });
}

export async function rejectProposal(
  proposalId: string,
  reason?: string,
): Promise<void> {
  const companyId = await getCompanyId();
  if (!companyId) throw new Error('Unauthorized');

  await gw(`/api/video/proposals/${proposalId}`, {
    method: 'PATCH',
    body: JSON.stringify({ action: 'reject', reason })
  });
}

export async function detectEditConflict(
  sessionId: string,
  projectId: string,
  elementId: string,
  elementType: string,
  aiEdit: any,
  humanEdit: any,
): Promise<{ conflictId: string }> {
  const companyId = await getCompanyId();
  if (!companyId) throw new Error('Unauthorized');

  const res = await gw('/api/video/conflicts', {
    method: 'POST',
    body: JSON.stringify({
      sessionId,
      projectId,
      elementId,
      elementType,
      aiEdit,
      humanEdit
    })
  });
  return { conflictId: res.conflictId };
}

export async function resolveConflict(
  conflictId: string,
  resolution: 'ai' | 'human' | 'merged' | 'discarded',
  note?: string,
): Promise<void> {
  const companyId = await getCompanyId();
  if (!companyId) throw new Error('Unauthorized');

  await gw(`/api/video/conflicts/${conflictId}`, {
    method: 'PATCH',
    body: JSON.stringify({ resolution, note })
  });
}

export async function getUnresolvedConflicts(
  sessionId: string,
): Promise<any[]> {
  const companyId = await getCompanyId();
  if (!companyId) return [];

  const res = await gw(`/api/video/sessions/${sessionId}/conflicts`);
  return res.conflicts || [];
}

export async function createVersionSnapshot(
  projectId: string,
  name: string,
  description: string,
  state: any,
): Promise<{ versionId: string }> {
  const companyId = await getCompanyId();
  if (!companyId) throw new Error('Unauthorized');

  const project = await gw(`/api/video/projects/${projectId}?companyId=${companyId}`);
  if (!project) throw new Error('Project not found');

  const res = await gw(`/api/video/projects/${projectId}/versions`, {
    method: 'POST',
    body: JSON.stringify({
      name,
      description,
      state,
      author: 'human',
      clipCount: (project.clips as any[])?.length || 0,
      duration: (project.timeline as any)?.totalDuration || 0,
    })
  });

  return { versionId: res.id };
}

export async function getVersionHistory(
  projectId: string,
): Promise<any[]> {
  const companyId = await getCompanyId();
  if (!companyId) return [];

  const res = await gw(`/api/video/projects/${projectId}/versions`);
  return res.versions || [];
}

export async function restoreVersion(
  versionId: string,
): Promise<any> {
  const companyId = await getCompanyId();
  if (!companyId) throw new Error('Unauthorized');

  // get the version snapshot to get the projectId
  // Wait, let's fetch version snapshot via projects versions? We can query restore endpoint which does the restore on video service
  // Wait, restore endpoint does:
  // POST /api/video/projects/:id/versions/:vId/restore
  // But wait, the video service restore endpoint needs to know project ID, but in Next.js Server Action we don't have projectId.
  // Wait, we can get version snapshot in Next.js server action first, or let's search if video-service restore endpoint can find it.
  // Wait, in services/video-service/src/index.ts we implemented:
  // app.post('/api/video/projects/:id/versions/:vId/restore', async (req, res) => { ... })
  // So it needs projectId. Let's find projectId.
  // Wait, since versionSnapshot is in the database, we can find it via a gateway endpoint or database search?
  // Wait, does next.js server action have access to database? No, we are separating it.
  // Wait! Let's check how services/video-service/src/index.ts implements the restore endpoint:
  // It fetches the versionSnapshot using findUnique, then updates VideoEditorProject.
  // Wait! Let's check:
  // `const version = await (prisma as any).versionSnapshot.findUnique({ where: { id: req.params.vId } });`
  // `await prisma.videoEditorProject.update({ where: { id: req.params.id }, ... })`
  // Yes! So it can fetch the version snapshot by versionId, and then updates the project.
  // But how does next.js action know which project ID to pass in the URL?
  // Ah! Next.js action `restoreVersion(versionId)` originally did:
  // `const version = await prisma.versionSnapshot.findUnique({ where: { id: versionId }, include: { project: { select: { companyId: true } } } })`
  // So next.js action can get the projectId from the version itself!
  // Wait, we can add a specific endpoint to `video-service` to get a version snapshot by ID, or we can just fetch the projectId.
  // Let's check: did we add `GET /api/video/versions/:versionId`? No.
  // Let's add `/api/video/versions/:versionId` to `services/video-service/src/index.ts` so we can get it, or let's update restore version in video-service to NOT require projectId in the path, or let's look at what we can do.
  // Actually, we can add:
  // `app.get('/api/video/versions/:versionId', async (req, res) => { ... })`
  // Let's see:
  // ```typescript
  // app.get('/api/video/versions/:vId', async (req, res) => {
  //   try {
  //     const version = await (prisma as any).versionSnapshot.findUnique({ where: { id: req.params.vId } });
  //     if (!version) return res.status(404).json({ error: 'Version not found' });
  //     res.json(version);
  //   } catch (error: any) { res.status(500).json({ error: error.message }); }
  // });
  // ```
  // That is super easy and clean! Let's add it to index.ts in video-service.
  // Wait, let's first finish writing the restoreVersion implementation in video-hybrid.ts:
  const version = await gw(`/api/video/versions/${versionId}`);
  if (!version) throw new Error('Version not found');

  const res = await gw(`/api/video/projects/${version.projectId}/versions/${versionId}/restore`, {
    method: 'POST'
  });
  return res.version.state;
}

export async function deleteVersion(
  versionId: string,
): Promise<void> {
  const companyId = await getCompanyId();
  if (!companyId) throw new Error('Unauthorized');

  const version = await gw(`/api/video/versions/${versionId}`);
  if (!version) throw new Error('Version not found');

  await gw(`/api/video/projects/${version.projectId}/versions/${versionId}`, {
    method: 'DELETE'
  });
}

export async function recordAICorrection(
  data: {
    actionType: string;
    aiSuggestion: any;
    userCorrection: any;
    category?: string;
    pattern?: string;
    confidenceDelta?: number;
    sessionId?: string;
  },
): Promise<void> {
  const companyId = await getCompanyId();
  if (!companyId) return;

  await gw('/api/video/corrections', {
    method: 'POST',
    body: JSON.stringify({
      ...data,
      companyId
    })
  });
}

export async function getCorrectionPatterns(
  actionType?: string,
): Promise<any[]> {
  const companyId = await getCompanyId();
  if (!companyId) return [];

  const res = await gw(`/api/video/corrections?companyId=${companyId}${actionType ? `&actionType=${actionType}` : ''}`);
  return res.patterns || [];
}

export async function addVideoComment(
  projectId: string,
  content: string,
  options?: {
    clipId?: string;
    timestamp?: number;
    parentId?: string;
  },
): Promise<{ commentId: string }> {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  const res = await gw(`/api/video/projects/${projectId}/comments`, {
    method: 'POST',
    body: JSON.stringify({
      authorId: session.user.id,
      authorName: session.user.name || 'Anonymous',
      content,
      clipId: options?.clipId,
      timestamp: options?.timestamp,
      parentId: options?.parentId,
    })
  });
  return { commentId: res.commentId };
}

export async function getVideoComments(
  projectId: string,
): Promise<any[]> {
  const companyId = await getCompanyId();
  if (!companyId) return [];

  const res = await gw(`/api/video/projects/${projectId}/comments`);
  return res.comments || [];
}

export async function resolveComment(
  commentId: string,
): Promise<void> {
  const companyId = await getCompanyId();
  if (!companyId) throw new Error('Unauthorized');

  await gw(`/api/video/comments/${commentId}/resolve`, {
    method: 'PATCH'
  });
}

export async function getEditHistoryByAuthor(
  sessionId: string,
  author?: 'ai' | 'human' | 'merged',
): Promise<any[]> {
  const companyId = await getCompanyId();
  if (!companyId) return [];

  const res = await gw(`/api/video/sessions/${sessionId}/edit-history${author ? `?author=${author}` : ''}`);
  return res.history || [];
}
