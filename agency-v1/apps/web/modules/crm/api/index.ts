/**
 * CRM Module — API Utilities
 * ─────────────────────────────────────────────────────────────────────────────
 * Client-side fetch helpers for CRM endpoints.
 * These call the Next.js API routes (app/api/crm/...) from the browser.
 * Server Actions (modules/crm/actions/crm.ts) are preferred for mutations;
 * these helpers are for read-heavy or polling scenarios.
 */

import type { Deal } from "@/modules/crm/types";

const BASE = "/api";

// ─── Generic fetcher ──────────────────────────────────────────────────────────
async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`API ${path} failed (${res.status}): ${body}`);
  }
  return res.json() as Promise<T>;
}

// ─── Deal endpoints ───────────────────────────────────────────────────────────
export interface DealsResponse {
  success: boolean;
  data: Deal[];
}

/** Fetch all deals for a company */
export async function fetchDeals(companyId: string): Promise<Deal[]> {
  const json = await apiFetch<DealsResponse>(
    `/crm/deals?companyId=${encodeURIComponent(companyId)}`
  );
  return json.data ?? [];
}

/** Fetch a single deal by ID */
export async function fetchDeal(dealId: string): Promise<Deal> {
  const json = await apiFetch<{ success: boolean; data: Deal }>(
    `/crm/deals/${encodeURIComponent(dealId)}`
  );
  return json.data;
}

/** Move a deal to a new stage via PATCH */
export async function patchDealStage(
  dealId: string,
  stage: string
): Promise<void> {
  await apiFetch(`/crm/deals/${encodeURIComponent(dealId)}`, {
    method: "PATCH",
    body: JSON.stringify({ stage }),
  });
}

// ─── Pipeline summary ─────────────────────────────────────────────────────────
export interface PipelineSummary {
  stage: string;
  count: number;
  totalValue: number;
}

/** Aggregate pipeline stats by stage */
export function computePipelineSummary(deals: Deal[]): PipelineSummary[] {
  const stageMap = new Map<string, { count: number; totalValue: number }>();
  for (const deal of deals) {
    const prev = stageMap.get(deal.stage) ?? { count: 0, totalValue: 0 };
    stageMap.set(deal.stage, {
      count: prev.count + 1,
      totalValue: prev.totalValue + deal.value,
    });
  }
  return Array.from(stageMap.entries()).map(([stage, stats]) => ({
    stage,
    ...stats,
  }));
}

// ─── Lead-to-deal conversion ──────────────────────────────────────────────────
/** POST a quick-create deal from a lead */
export async function createDealFromLead(payload: {
  title: string;
  value: number;
  companyId: string;
  contactName?: string;
  contactEmail?: string;
}): Promise<Deal> {
  const json = await apiFetch<{ success: boolean; data: Deal }>("/crm/deals", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return json.data;
}
