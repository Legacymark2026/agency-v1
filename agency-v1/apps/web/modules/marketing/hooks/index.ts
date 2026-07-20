"use client";

/**
 * Marketing Module — Custom Hooks
 * ─────────────────────────────────────────────────────────────────────────────
 * Client-side hooks for campaign management, attribution, and analytics
 * within the Marketing module. All hooks are pure computations.
 */

import { useMemo, useState, useCallback } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────
export interface Campaign {
  id: string;
  name: string;
  status: "DRAFT" | "ACTIVE" | "PAUSED" | "COMPLETED";
  channel: string;
  budget: number;
  spent: number;
  leads: number;
  conversions: number;
  revenue: number;
  startDate: string | Date;
  endDate?: string | Date | null;
}

export interface CampaignFilters {
  searchQuery: string;
  status: Campaign["status"] | null;
  channel: string | null;
}

const DEFAULT_CAMPAIGN_FILTERS: CampaignFilters = {
  searchQuery: "",
  status: null,
  channel: null,
};

// ─── useCampaignFilters ────────────────────────────────────────────────────────
/**
 * Filter campaigns by name, status, and channel.
 */
export function useCampaignFilters(campaigns: Campaign[]) {
  const [filters, setFilters] = useState<CampaignFilters>(DEFAULT_CAMPAIGN_FILTERS);

  const setFilter = useCallback(
    <K extends keyof CampaignFilters>(key: K, value: CampaignFilters[K]) => {
      setFilters((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const resetFilters = useCallback(() => setFilters(DEFAULT_CAMPAIGN_FILTERS), []);

  const filteredCampaigns = useMemo(() => {
    return campaigns.filter((c) => {
      if (filters.searchQuery) {
        const q = filters.searchQuery.toLowerCase();
        if (!c.name.toLowerCase().includes(q)) return false;
      }
      if (filters.status && c.status !== filters.status) return false;
      if (filters.channel && c.channel !== filters.channel) return false;
      return true;
    });
  }, [campaigns, filters]);

  return { filters, setFilter, resetFilters, filteredCampaigns };
}

// ─── useCampaignMetrics ────────────────────────────────────────────────────────
export interface CampaignMetrics {
  totalBudget: number;
  totalSpent: number;
  totalLeads: number;
  totalConversions: number;
  totalRevenue: number;
  averageROI: number;
  averageCPL: number; // Cost per Lead
  averageCPA: number; // Cost per Acquisition
  activeCampaigns: number;
}

/**
 * Computes aggregated marketing KPIs from a list of campaigns.
 */
export function useCampaignMetrics(campaigns: Campaign[]): CampaignMetrics {
  return useMemo(() => {
    const totalBudget = campaigns.reduce((s, c) => s + c.budget, 0);
    const totalSpent = campaigns.reduce((s, c) => s + c.spent, 0);
    const totalLeads = campaigns.reduce((s, c) => s + c.leads, 0);
    const totalConversions = campaigns.reduce((s, c) => s + c.conversions, 0);
    const totalRevenue = campaigns.reduce((s, c) => s + c.revenue, 0);

    const averageROI =
      totalSpent > 0
        ? Math.round(((totalRevenue - totalSpent) / totalSpent) * 100)
        : 0;
    const averageCPL = totalLeads > 0 ? Math.round(totalSpent / totalLeads) : 0;
    const averageCPA =
      totalConversions > 0 ? Math.round(totalSpent / totalConversions) : 0;

    return {
      totalBudget,
      totalSpent,
      totalLeads,
      totalConversions,
      totalRevenue,
      averageROI,
      averageCPL,
      averageCPA,
      activeCampaigns: campaigns.filter((c) => c.status === "ACTIVE").length,
    };
  }, [campaigns]);
}

// ─── useAttributionAnalysis ────────────────────────────────────────────────────
export interface ChannelAttribution {
  channel: string;
  leads: number;
  conversions: number;
  revenue: number;
  share: number; // percentage of total revenue
}

/**
 * Breaks down campaign performance by marketing channel.
 */
export function useAttributionAnalysis(campaigns: Campaign[]): ChannelAttribution[] {
  return useMemo(() => {
    const channelMap = new Map<
      string,
      { leads: number; conversions: number; revenue: number }
    >();

    for (const c of campaigns) {
      const prev = channelMap.get(c.channel) ?? {
        leads: 0,
        conversions: 0,
        revenue: 0,
      };
      channelMap.set(c.channel, {
        leads: prev.leads + c.leads,
        conversions: prev.conversions + c.conversions,
        revenue: prev.revenue + c.revenue,
      });
    }

    const totalRevenue = Array.from(channelMap.values()).reduce(
      (s, v) => s + v.revenue,
      0
    );

    return Array.from(channelMap.entries())
      .map(([channel, stats]) => ({
        channel,
        ...stats,
        share:
          totalRevenue > 0
            ? Math.round((stats.revenue / totalRevenue) * 100)
            : 0,
      }))
      .sort((a, b) => b.revenue - a.revenue);
  }, [campaigns]);
}
