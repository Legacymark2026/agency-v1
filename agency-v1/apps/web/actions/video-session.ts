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

export async function createVideoAISession(
  projectId: string,
  prompt: string,
): Promise<{ sessionId: string }> {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  const companyId = await getCompanyId();
  if (!companyId) throw new Error('Company not found');

  const project = await prisma.videoEditorProject.findFirst({
    where: { id: projectId, companyId },
  });

  if (!project) throw new Error('Project not found');

  const aiSession = await prisma.videoAISession.create({
    data: {
      companyId,
      projectId,
      prompt,
      status: 'ACTIVE',
    },
  });

  await prisma.videoEditorProject.update({
    where: { id: projectId },
    data: { activeSessionId: aiSession.id },
  });

  return { sessionId: aiSession.id };
}

export async function addAIMessage(
  sessionId: string,
  role: 'user' | 'assistant' | 'system' | 'tool',
  content: string,
  toolCalls?: any[],
  toolResults?: any,
): Promise<{ messageId: string }> {
  const companyId = await getCompanyId();
  if (!companyId) throw new Error('Unauthorized');

  const aiSession = await prisma.videoAISession.findFirst({
    where: { id: sessionId, companyId },
  });

  if (!aiSession) throw new Error('Session not found');
  if (aiSession.status !== 'ACTIVE') throw new Error('Session is not active');

  const message = await prisma.videoAIMessage.create({
    data: {
      sessionId,
      role,
      content,
      toolCalls,
      toolResults,
    },
  });

  return { messageId: message.id };
}

export async function getAISessionMessages(
  sessionId: string,
  limit: number = 50,
): Promise<any[]> {
  const companyId = await getCompanyId();
  if (!companyId) return [];

  const aiSession = await prisma.videoAISession.findFirst({
    where: { id: sessionId, companyId },
  });

  if (!aiSession) return [];

  return prisma.videoAIMessage.findMany({
    where: { sessionId },
    orderBy: { createdAt: 'asc' },
    take: limit,
    select: {
      id: true,
      role: true,
      content: true,
      toolCalls: true,
      toolResults: true,
      createdAt: true,
    },
  });
}

export async function getActiveAISession(
  projectId: string,
): Promise<any | null> {
  const companyId = await getCompanyId();
  if (!companyId) return null;

  return prisma.videoAISession.findFirst({
    where: {
      projectId,
      companyId,
      status: 'ACTIVE',
    },
    include: {
      messages: {
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
    },
  });
}

export async function completeAISession(sessionId: string): Promise<void> {
  const companyId = await getCompanyId();
  if (!companyId) return;

  await prisma.videoAISession.updateMany({
    where: { id: sessionId, companyId },
    data: { status: 'COMPLETED' },
  });
}

export async function getEditHistory(
  sessionId: string,
  limit: number = 20,
): Promise<any[]> {
  const companyId = await getCompanyId();
  if (!companyId) return [];

  const aiSession = await prisma.videoAISession.findFirst({
    where: { id: sessionId, companyId },
  });

  if (!aiSession) return [];

  return prisma.videoEditHistory.findMany({
    where: { sessionId },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
}

export async function undoLastEdit(sessionId: string): Promise<any | null> {
  const companyId = await getCompanyId();
  if (!companyId) return null;

  const aiSession = await prisma.videoAISession.findFirst({
    where: { id: sessionId, companyId },
  });

  if (!aiSession) return null;

  const lastEdit = await prisma.videoEditHistory.findFirst({
    where: { sessionId, undone: false },
    orderBy: { createdAt: 'desc' },
  });

  if (!lastEdit) return null;

  await prisma.videoEditHistory.update({
    where: { id: lastEdit.id },
    data: { undone: true },
  });

  return (lastEdit.beforeState as any) || null;
}

export async function redoLastEdit(sessionId: string): Promise<any | null> {
  const companyId = await getCompanyId();
  if (!companyId) return null;

  const aiSession = await prisma.videoAISession.findFirst({
    where: { id: sessionId, companyId },
  });

  if (!aiSession) return null;

  const lastUndone = await prisma.videoEditHistory.findFirst({
    where: { sessionId, undone: true },
    orderBy: { createdAt: 'desc' },
  });

  if (!lastUndone) return null;

  await prisma.videoEditHistory.update({
    where: { id: lastUndone.id },
    data: { undone: false },
  });

  return (lastUndone.afterState as any) || null;
}

export async function logEditAction(
  sessionId: string,
  action: string,
  description: string,
  beforeState: any,
  afterState: any,
): Promise<{ historyId: string }> {
  const companyId = await getCompanyId();
  if (!companyId) throw new Error('Unauthorized');

  const aiSession = await prisma.videoAISession.findFirst({
    where: { id: sessionId, companyId },
  });

  if (!aiSession) throw new Error('Session not found');

  const history = await prisma.videoEditHistory.create({
    data: {
      sessionId,
      action,
      description,
      beforeState,
      afterState,
    },
  });

  return { historyId: history.id };
}
