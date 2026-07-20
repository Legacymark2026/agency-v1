/**
 * Marketing Module — Utility Library
 * ─────────────────────────────────────────────────────────────────────────────
 * Pure functions for marketing data transformation, formatting,
 * and business logic. No side effects — safe to use on server or client.
 */

// ─── Currency / number formatters ─────────────────────────────────────────────
/** Format a number as a compact currency string (e.g. 1200 → "$1.2K") */
export function formatBudget(value: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

/** Format a percentage (0-100) with a ± prefix if delta */
export function formatPercentage(value: number, showSign = false): string {
  const prefix = showSign && value > 0 ? "+" : "";
  return `${prefix}${value.toFixed(1)}%`;
}

// ─── ROI / CPL / CPA ──────────────────────────────────────────────────────────
/** Return on Investment as a percentage */
export function computeROI(revenue: number, spent: number): number {
  if (spent === 0) return 0;
  return Math.round(((revenue - spent) / spent) * 100);
}

/** Cost per Lead */
export function computeCPL(spent: number, leads: number): number {
  if (leads === 0) return 0;
  return Math.round(spent / leads);
}

/** Cost per Acquisition */
export function computeCPA(spent: number, conversions: number): number {
  if (conversions === 0) return 0;
  return Math.round(spent / conversions);
}

/** Conversion rate as a percentage (0–100) */
export function computeConversionRate(conversions: number, leads: number): number {
  if (leads === 0) return 0;
  return Math.round((conversions / leads) * 100);
}

// ─── Date helpers ─────────────────────────────────────────────────────────────
/** Returns the current period in YYYY-MM format */
export function currentPeriod(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

/** Returns an array of the last N months in YYYY-MM format */
export function lastNMonths(n: number): string[] {
  const months: string[] = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
    );
  }
  return months;
}

/** Format a date string as a readable month label (e.g. "2024-03" → "Mar 2024") */
export function formatMonthLabel(yearMonth: string): string {
  const [year, month] = yearMonth.split("-").map(Number);
  return new Date(year, month - 1).toLocaleString("default", {
    month: "short",
    year: "numeric",
  });
}

// ─── Channel meta ─────────────────────────────────────────────────────────────
export const MARKETING_CHANNELS = [
  { id: "facebook_ads", label: "Facebook Ads", icon: "📘" },
  { id: "google_ads", label: "Google Ads", icon: "🔍" },
  { id: "instagram", label: "Instagram", icon: "📸" },
  { id: "tiktok", label: "TikTok Ads", icon: "🎵" },
  { id: "email", label: "Email Marketing", icon: "✉️" },
  { id: "whatsapp", label: "WhatsApp", icon: "💬" },
  { id: "organic", label: "Orgánico / SEO", icon: "🌿" },
  { id: "referral", label: "Referidos", icon: "🤝" },
  { id: "other", label: "Otro", icon: "📦" },
] as const;

export type MarketingChannelId = (typeof MARKETING_CHANNELS)[number]["id"];

/** Get channel label by ID */
export function getChannelLabel(channelId: string): string {
  return (
    MARKETING_CHANNELS.find((c) => c.id === channelId)?.label ?? channelId
  );
}

/** Get channel icon emoji by ID */
export function getChannelIcon(channelId: string): string {
  return MARKETING_CHANNELS.find((c) => c.id === channelId)?.icon ?? "📦";
}

// ─── Funnel analysis ──────────────────────────────────────────────────────────
export interface FunnelStage {
  label: string;
  count: number;
  dropoffRate: number; // % lost vs previous stage
}

/**
 * Compute funnel drop-off rates from an ordered array of stage counts.
 * Example: computeFunnel(["Impresiones", "Clics", "Leads", "Ventas"], [10000, 500, 50, 10])
 */
export function computeFunnel(
  labels: string[],
  counts: number[]
): FunnelStage[] {
  return labels.map((label, i) => {
    const count = counts[i] ?? 0;
    const prev = counts[i - 1] ?? count;
    const dropoffRate =
      prev > 0 && i > 0 ? Math.round(((prev - count) / prev) * 100) : 0;
    return { label, count, dropoffRate };
  });
}
