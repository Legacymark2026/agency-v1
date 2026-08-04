'use server';

import { auth } from '@/lib/auth';

const GATEWAY_URL = process.env.API_GATEWAY_URL || 'http://localhost:8080';

async function gw(path: string, options: RequestInit = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);
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

async function getUserId(): Promise<string> {
  const session = await auth();
  return session?.user?.id || 'user-default';
}

// ── Core Agent Execution ──────────────────────────────────────────────────

export async function runAgentExecution(agentId: string, userMessage: string, conversationId?: string, leadId?: string) {
  try {
    const companyId = await getCompanyId();
    return await gw(`/api/v1/agents/${agentId}/run`, {
      method: 'POST',
      body: JSON.stringify({ companyId, userMessage, conversationId, leadId })
    });
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function getAvailableAgentTools() {
  try { return await gw('/api/v1/agents/tools'); }
  catch (err: any) { return { success: false, error: err.message }; }
}

export async function getAgentPresets() {
  try { return await gw('/api/v1/agents/presets'); }
  catch (err: any) { return { success: false, error: err.message }; }
}

// ── Governance (Autonomy Mode, Temperature, Thresholds) ──────────────────

export async function getGovernanceConfig(agentId: string) {
  try {
    const companyId = await getCompanyId();
    return await gw(`/api/v1/agents/${agentId}/governance?companyId=${companyId}`);
  } catch (err: any) { return { success: false, error: err.message }; }
}

export async function updateGovernanceConfig(agentId: string, updates: {
  autonomyMode?: 'AUTONOMOUS' | 'SEMI_AUTONOMOUS' | 'SUPERVISED_ONLY';
  temperature?: number;
  dailyTokenBudget?: number;
  monthlyUsdBudget?: number;
  hitlConfidenceThreshold?: number;
  hitlHighValueQuoteUsd?: number;
  allowedTools?: string[];
  systemPromptOverride?: string;
  isActive?: boolean;
}) {
  try {
    const companyId = await getCompanyId();
    return await gw(`/api/v1/agents/${agentId}/governance`, {
      method: 'PATCH',
      body: JSON.stringify({ companyId, ...updates })
    });
  } catch (err: any) { return { success: false, error: err.message }; }
}

export async function listGovernanceConfigs() {
  try {
    const companyId = await getCompanyId();
    return await gw(`/api/v1/agents/governance?companyId=${companyId}`);
  } catch (err: any) { return { success: false, error: err.message }; }
}

// ── Reasoning Traces (Audit Logs) ────────────────────────────────────────

export async function listReasoningTraces(limit = 20, offset = 0) {
  try {
    const companyId = await getCompanyId();
    return await gw(`/api/v1/agents/traces?companyId=${companyId}&limit=${limit}&offset=${offset}`);
  } catch (err: any) { return { success: false, error: err.message }; }
}

export async function getReasoningTrace(traceId: string) {
  try {
    const companyId = await getCompanyId();
    return await gw(`/api/v1/agents/traces/${traceId}?companyId=${companyId}`);
  } catch (err: any) { return { success: false, error: err.message }; }
}

// ── Feedback (👍 / 👎 + Stars) ────────────────────────────────────────────

export async function submitFeedback(agentId: string, rating: 'THUMBS_UP' | 'THUMBS_DOWN', opts?: {
  stars?: number;
  comment?: string;
  conversationId?: string;
  traceId?: string;
}) {
  try {
    const companyId = await getCompanyId();
    const userId = await getUserId();
    return await gw(`/api/v1/agents/${agentId}/feedback`, {
      method: 'POST',
      body: JSON.stringify({ companyId, userId, rating, ...opts })
    });
  } catch (err: any) { return { success: false, error: err.message }; }
}

export async function getAgentFeedbackStats(agentId: string) {
  try {
    const companyId = await getCompanyId();
    return await gw(`/api/v1/agents/${agentId}/feedback/stats?companyId=${companyId}`);
  } catch (err: any) { return { success: false, error: err.message }; }
}

// ── ReFRAG ────────────────────────────────────────────────────────────────

export async function queryRefragDocs(query: string, topK = 5) {
  try {
    const companyId = await getCompanyId();
    return await gw('/api/v1/agents/refrag/query', {
      method: 'POST',
      body: JSON.stringify({ companyId, query, topK })
    });
  } catch (err: any) { return { success: false, error: err.message }; }
}

// ── Human-in-the-Loop (HITL) ──────────────────────────────────────────────

export async function getPendingHitlReviews() {
  try {
    const companyId = await getCompanyId();
    return await gw(`/api/v1/agents/hitl/pending?companyId=${companyId}`);
  } catch (err: any) { return { success: false, error: err.message }; }
}

export async function processHitlDecision(hitlId: string, decision: 'APPROVED' | 'REJECTED' | 'MODIFIED', modifiedResponse?: string) {
  try {
    const companyId = await getCompanyId();
    const userId = await getUserId();
    return await gw('/api/v1/agents/hitl/decision', {
      method: 'POST',
      body: JSON.stringify({ companyId, hitlId, decision, userId, modifiedResponse })
    });
  } catch (err: any) { return { success: false, error: err.message }; }
}

// ── Guardrails ────────────────────────────────────────────────────────────

export async function checkGuardrailsText(text: string) {
  try { return await gw('/api/v1/agents/guardrails/check', { method: 'POST', body: JSON.stringify({ text }) }); }
  catch (err: any) { return { success: false, error: err.message }; }
}

// ── Memory ────────────────────────────────────────────────────────────────

export async function getConversationMemory(conversationId: string) {
  try { return await gw(`/api/v1/agents/memory/${conversationId}`); }
  catch (err: any) { return { success: false, error: err.message }; }
}
