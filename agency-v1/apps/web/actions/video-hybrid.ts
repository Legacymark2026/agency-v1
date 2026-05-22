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

  const proposal = await prisma.editProposal.create({
    data: {
      sessionId: data.sessionId,
      projectId: data.projectId,
      type: data.type,
      title: data.title,
      description: data.description,
      confidence: data.confidence,
      beforeState: data.beforeState,
      afterState: data.afterState,
      metadata: data.metadata,
      status: 'pending',
    },
  });

  return { proposalId: proposal.id };
}

export async function getPendingProposals(
  sessionId: string,
): Promise<any[]> {
  const companyId = await getCompanyId();
  if (!companyId) return [];

  return prisma.editProposal.findMany({
    where: {
      sessionId,
      status: 'pending',
    },
    orderBy: { confidence: 'desc' },
  });
}

export async function approveProposal(
  proposalId: string,
): Promise<void> {
  const companyId = await getCompanyId();
  if (!companyId) throw new Error('Unauthorized');

  const proposal = await prisma.editProposal.findFirst({
    where: { id: proposalId },
    include: { session: { select: { projectId: true } } },
  });

  if (!proposal) throw new Error('Proposal not found');

  await prisma.editProposal.update({
    where: { id: proposalId },
    data: {
      status: 'approved',
      respondedAt: new Date(),
    },
  });

  await prisma.videoEditHistory.create({
    data: {
      sessionId: proposal.sessionId,
      action: proposal.type,
      author: 'merged',
      confidence: proposal.confidence,
      description: `AI proposal approved: ${proposal.title}`,
      beforeState: proposal.beforeState,
      afterState: proposal.afterState,
    },
  });
}

export async function rejectProposal(
  proposalId: string,
  reason?: string,
): Promise<void> {
  const companyId = await getCompanyId();
  if (!companyId) throw new Error('Unauthorized');

  await prisma.editProposal.update({
    where: { id: proposalId },
    data: {
      status: 'rejected',
      respondedAt: new Date(),
      metadata: {
        rejectionReason: reason,
      },
    },
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

  const conflict = await prisma.editConflict.create({
    data: {
      sessionId,
      projectId,
      elementId,
      elementType,
      aiEdit,
      humanEdit,
      resolved: false,
    },
  });

  return { conflictId: conflict.id };
}

export async function resolveConflict(
  conflictId: string,
  resolution: 'ai' | 'human' | 'merged' | 'discarded',
  note?: string,
): Promise<void> {
  const companyId = await getCompanyId();
  if (!companyId) throw new Error('Unauthorized');

  await prisma.editConflict.update({
    where: { id: conflictId },
    data: {
      resolved: true,
      resolution,
      resolutionNote: note,
      resolvedAt: new Date(),
    },
  });
}

export async function getUnresolvedConflicts(
  sessionId: string,
): Promise<any[]> {
  const companyId = await getCompanyId();
  if (!companyId) return [];

  return prisma.editConflict.findMany({
    where: {
      sessionId,
      resolved: false,
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function createVersionSnapshot(
  projectId: string,
  name: string,
  description: string,
  state: any,
): Promise<{ versionId: string }> {
  const companyId = await getCompanyId();
  if (!companyId) throw new Error('Unauthorized');

  const project = await prisma.videoEditorProject.findFirst({
    where: { id: projectId, companyId },
  });

  if (!project) throw new Error('Project not found');

  const version = await prisma.versionSnapshot.create({
    data: {
      projectId,
      name,
      description,
      state,
      author: 'human',
      clipCount: (project.clips as any[])?.length || 0,
      duration: (project.timeline as any)?.totalDuration || 0,
    },
  });

  return { versionId: version.id };
}

export async function getVersionHistory(
  projectId: string,
): Promise<any[]> {
  const companyId = await getCompanyId();
  if (!companyId) return [];

  return prisma.versionSnapshot.findMany({
    where: { projectId },
    orderBy: { createdAt: 'desc' },
    take: 20,
  });
}

export async function restoreVersion(
  versionId: string,
): Promise<any> {
  const companyId = await getCompanyId();
  if (!companyId) throw new Error('Unauthorized');

  const version = await prisma.versionSnapshot.findUnique({
    where: { id: versionId },
    include: {
      project: {
        select: { companyId: true },
      },
    },
  });

  if (!version || version.project.companyId !== companyId) {
    throw new Error('Version not found');
  }

  await prisma.videoEditorProject.update({
    where: { id: version.projectId },
    data: {
      clips: version.state.clips,
      audioTracks: version.state.audioTracks,
      textOverlays: version.state.textOverlays,
      colorGrades: version.state.colorGrades,
      speedRamps: version.state.speedRamps,
      soundLayers: version.state.soundLayers,
      timeline: version.state.timeline,
      config: version.state.config,
    },
  });

  return version.state;
}

export async function deleteVersion(
  versionId: string,
): Promise<void> {
  const companyId = await getCompanyId();
  if (!companyId) throw new Error('Unauthorized');

  await prisma.versionSnapshot.deleteMany({
    where: { id: versionId },
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

  await prisma.aICorrection.create({
    data: {
      companyId,
      sessionId: data.sessionId,
      actionType: data.actionType,
      aiSuggestion: data.aiSuggestion,
      userCorrection: data.userCorrection,
      category: data.category,
      pattern: data.pattern,
      confidenceDelta: data.confidenceDelta,
    },
  });
}

export async function getCorrectionPatterns(
  actionType?: string,
): Promise<any[]> {
  const companyId = await getCompanyId();
  if (!companyId) return [];

  return prisma.aICorrection.groupBy({
    by: ['actionType', 'category', 'pattern'],
    where: {
      companyId,
      ...(actionType ? { actionType } : {}),
    },
    _count: true,
    orderBy: { _count: { pattern: 'desc' } },
    take: 20,
  });
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

  const comment = await prisma.videoComment.create({
    data: {
      projectId,
      authorId: session.user.id,
      authorName: session.user.name || 'Anonymous',
      content,
      clipId: options?.clipId,
      timestamp: options?.timestamp,
      parentId: options?.parentId,
    },
  });

  return { commentId: comment.id };
}

export async function getVideoComments(
  projectId: string,
): Promise<any[]> {
  const companyId = await getCompanyId();
  if (!companyId) return [];

  return prisma.videoComment.findMany({
    where: { projectId },
    orderBy: { createdAt: 'asc' },
  });
}

export async function resolveComment(
  commentId: string,
): Promise<void> {
  const companyId = await getCompanyId();
  if (!companyId) throw new Error('Unauthorized');

  await prisma.videoComment.update({
    where: { id: commentId },
    data: { resolved: true },
  });
}

export async function getEditHistoryByAuthor(
  sessionId: string,
  author?: 'ai' | 'human' | 'merged',
): Promise<any[]> {
  const companyId = await getCompanyId();
  if (!companyId) return [];

  return prisma.videoEditHistory.findMany({
    where: {
      sessionId,
      ...(author ? { author } : {}),
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
}
