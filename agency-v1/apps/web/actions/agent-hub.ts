'use server';

import { auth } from '@/lib/auth';

const GATEWAY_URL = process.env.API_GATEWAY_URL || 'http://localhost:8080';

async function gw(path: string, options: RequestInit = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  try {
    const res = await fetch(`${GATEWAY_URL}${path}`, {
      ...options,
      signal: controller.signal,
      headers: { 'Content-Type': 'application/json', ...options.headers }
    });
    clearTimeout(timeout);
    if (res.ok) return await res.json();
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || err.message || `Error ${res.status}`);
  } catch (err: any) {
    clearTimeout(timeout);
    throw err;
  }
}

async function getCompanyId(): Promise<string> {
  const session = await auth();
  return session?.user?.companyId || 'company-default';
}

export async function getAvailableAgentTools() {
  try {
    return await gw('/api/v1/agents/tools');
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function getAgentPresets() {
  try {
    return await gw('/api/v1/agents/presets');
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function runAgentExecution(agentId: string, userMessage: string, conversationId?: string) {
  try {
    const companyId = await getCompanyId();
    return await gw(`/api/v1/agents/${agentId}/run`, {
      method: 'POST',
      body: JSON.stringify({ companyId, userMessage, conversationId })
    });
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function getConversationMemory(conversationId: string) {
  try {
    return await gw(`/api/v1/agents/memory/${conversationId}`);
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
