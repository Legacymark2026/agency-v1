"use client";

/**
 * CRM Custom Hooks
 * ─────────────────────────────────────────────────────────────────────────────
 * Client-side hooks for filtering, searching, and metrics computation
 * within the CRM module. All hooks are pure computations — no server calls.
 */

import { useMemo, useState, useCallback } from "react";
import type { Deal } from "@/modules/crm/types";
import { STAGES, getStageLabelById } from "@/modules/crm/lib/crm-config";

// ─── useDealFilters ────────────────────────────────────────────────────────────
export interface DealFilters {
  searchQuery: string;
  stage: string | null;
  priority: string | null;
  source: string | null;
  minValue: number | null;
  maxValue: number | null;
}

const DEFAULT_FILTERS: DealFilters = {
  searchQuery: "",
  stage: null,
  priority: null,
  source: null,
  minValue: null,
  maxValue: null,
};

/**
 * Provides filter state + filtered deal list.
 * Usage:
 *   const { filters, setFilter, resetFilters, filteredDeals } = useDealFilters(deals);
 */
export function useDealFilters(deals: Deal[]) {
  const [filters, setFilters] = useState<DealFilters>(DEFAULT_FILTERS);

  const setFilter = useCallback(
    <K extends keyof DealFilters>(key: K, value: DealFilters[K]) => {
      setFilters((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const resetFilters = useCallback(() => setFilters(DEFAULT_FILTERS), []);

  const filteredDeals = useMemo(() => {
    return deals.filter((deal) => {
      if (filters.searchQuery) {
        const q = filters.searchQuery.toLowerCase();
        const matchTitle = deal.title.toLowerCase().includes(q);
        const matchContact =
          deal.contactName?.toLowerCase().includes(q) ?? false;
        const matchEmail =
          deal.contactEmail?.toLowerCase().includes(q) ?? false;
        if (!matchTitle && !matchContact && !matchEmail) return false;
      }

      if (filters.stage && deal.stage !== filters.stage) return false;
      if (filters.priority && (deal as any).priority !== filters.priority)
        return false;
      if (filters.source && deal.source !== filters.source) return false;
      if (filters.minValue !== null && deal.value < filters.minValue)
        return false;
      if (filters.maxValue !== null && deal.value > filters.maxValue)
        return false;

      return true;
    });
  }, [deals, filters]);

  return { filters, setFilter, resetFilters, filteredDeals };
}

// ─── useDealSearch ─────────────────────────────────────────────────────────────
/**
 * Lightweight search-only hook for quick deal lookups.
 * Returns deals matching a query across title, contact name, and email.
 */
export function useDealSearch(deals: Deal[], query: string): Deal[] {
  return useMemo(() => {
    if (!query.trim()) return deals;
    const q = query.toLowerCase();
    return deals.filter(
      (d) =>
        d.title.toLowerCase().includes(q) ||
        d.contactName?.toLowerCase().includes(q) ||
        d.contactEmail?.toLowerCase().includes(q)
    );
  }, [deals, query]);
}

// ─── useCRMMetrics ─────────────────────────────────────────────────────────────
export interface CRMDashboardMetrics {
  totalDeals: number;
  totalValue: number;
  wonDeals: number;
  lostDeals: number;
  activeDeals: number;
  conversionRate: number;
  averageDealSize: number;
  dealsByStage: Record<string, { count: number; value: number; label: string }>;
  topDeals: Deal[];
}

/**
 * Computes CRM KPIs from a list of deals — memoized, no side effects.
 * Usage:
 *   const metrics = useCRMMetrics(deals);
 */
export function useCRMMetrics(deals: Deal[]): CRMDashboardMetrics {
  return useMemo(() => {
    const wonDeals = deals.filter((d) => d.stage === "WON").length;
    const lostDeals = deals.filter((d) => d.stage === "LOST").length;
    const closedDeals = wonDeals + lostDeals;
    const conversionRate =
      closedDeals > 0 ? Math.round((wonDeals / closedDeals) * 100) : 0;

    const totalValue = deals.reduce(
      (sum, d) => sum + (d.stage !== "LOST" ? d.value : 0),
      0
    );

    const dealsByStage: CRMDashboardMetrics["dealsByStage"] = {};
    for (const stage of STAGES) {
      const stageDeals = deals.filter((d) => d.stage === stage.id);
      dealsByStage[stage.id] = {
        count: stageDeals.length,
        value: stageDeals.reduce((s, d) => s + d.value, 0),
        label: stage.label,
      };
    }

    const topDeals = [...deals]
      .filter((d) => d.stage !== "LOST")
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    return {
      totalDeals: deals.length,
      totalValue,
      wonDeals,
      lostDeals,
      activeDeals: deals.filter(
        (d) => d.stage !== "WON" && d.stage !== "LOST"
      ).length,
      conversionRate,
      averageDealSize: deals.length > 0 ? Math.round(totalValue / deals.length) : 0,
      dealsByStage,
      topDeals,
    };
  }, [deals]);
}

// ─── useDealSort ───────────────────────────────────────────────────────────────
export type SortField = "value" | "createdAt" | "updatedAt" | "probability";
export type SortDirection = "asc" | "desc";

/**
 * Sorts deals by a given field and direction.
 */
export function useDealSort(
  deals: Deal[],
  field: SortField = "updatedAt",
  direction: SortDirection = "desc"
): Deal[] {
  return useMemo(() => {
    return [...deals].sort((a, b) => {
      const valA = a[field] as any;
      const valB = b[field] as any;
      const cmp =
        typeof valA === "number"
          ? valA - valB
          : new Date(valA).getTime() - new Date(valB).getTime();
      return direction === "asc" ? cmp : -cmp;
    });
  }, [deals, field, direction]);
}
