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

export async function createVideoAISession(
  projectId: string,
  prompt: string,
): Promise<{ sessionId: string }> {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  const companyId = await getCompanyId();
  if (!companyId) throw new Error('Company not found');

  const project = await gw(`/api/video/projects/${projectId}?companyId=${companyId}`);
  if (!project) throw new Error('Project not found');

  const aiSession = await gw('/api/video/sessions', {
    method: 'POST',
    body: JSON.stringify({
      companyId,
      projectId,
      prompt,
      status: 'ACTIVE',
    })
  });

  await gw(`/api/video/projects/${projectId}`, {
    method: 'PATCH',
    body: JSON.stringify({
      companyId,
      activeSessionId: aiSession.id
    })
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

  const aiSession = await gw(`/api/video/sessions/${sessionId}`);
  if (!aiSession) throw new Error('Session not found');
  if (aiSession.status !== 'ACTIVE') throw new Error('Session is not active');

  return await gw(`/api/video/sessions/${sessionId}/messages`, {
    method: 'POST',
    body: JSON.stringify({
      role,
      content,
      toolCalls,
      toolResults
    })
  });
}

export async function getAISessionMessages(
  sessionId: string,
  limit: number = 50,
): Promise<any[]> {
  const companyId = await getCompanyId();
  if (!companyId) return [];

  try {
    return await gw(`/api/video/sessions/${sessionId}/messages?limit=${limit}`);
  } catch {
    return [];
  }
}

export async function getActiveAISession(
  projectId: string,
): Promise<any | null> {
  const companyId = await getCompanyId();
  if (!companyId) return null;

  try {
    const res = await gw(`/api/video/sessions?projectId=${projectId}&companyId=${companyId}`);
    const active = res.sessions?.find((s: any) => s.status === 'ACTIVE');
    if (!active) return null;
    return await gw(`/api/video/sessions/${active.id}`);
  } catch {
    return null;
  }
}

export async function completeAISession(sessionId: string): Promise<void> {
  const companyId = await getCompanyId();
  if (!companyId) return;

  try {
    await gw(`/api/video/sessions/${sessionId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'COMPLETED' })
    });
  } catch (err) {
    console.error('Error completing AI session:', err);
  }
}

export async function getEditHistory(
  sessionId: string,
  limit: number = 20,
): Promise<any[]> {
  const companyId = await getCompanyId();
  if (!companyId) return [];

  try {
    const res = await gw(`/api/video/sessions/${sessionId}/edit-history`);
    return res.history || [];
  } catch {
    return [];
  }
}

export async function undoLastEdit(sessionId: string): Promise<any | null> {
  const companyId = await getCompanyId();
  if (!companyId) return null;

  try {
    return await gw(`/api/video/sessions/${sessionId}/undo`, {
      method: 'POST'
    });
  } catch {
    return null;
  }
}

export async function redoLastEdit(sessionId: string): Promise<any | null> {
  const companyId = await getCompanyId();
  if (!companyId) return null;

  try {
    return await gw(`/api/video/sessions/${sessionId}/redo`, {
      method: 'POST'
    });
  } catch {
    return null;
  }
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

  return await gw(`/api/video/sessions/${sessionId}/history`, {
    method: 'POST',
    body: JSON.stringify({
      action,
      description,
      beforeState,
      afterState
    })
  });
}
