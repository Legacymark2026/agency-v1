/**
 * apps/web/app/web-vitals.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Real User Monitoring (RUM) & Core Web Vitals Reporter
 * Measures and logs Google Core Web Vitals (LCP, INP, CLS, TTFB, FID)
 */

export interface Metric {
  id: string;
  name: string;
  value: number;
  rating: "good" | "needs-improvement" | "poor";
  delta: number;
  navigationType: string;
}

export function reportWebVitals(metric: Metric) {
  const { name, value, rating, id } = metric;

  // Log in non-production for debugging
  if (process.env.NODE_ENV !== "production") {
    console.log(`⚡ [WebVitals] ${name}: ${value.toFixed(2)} (${rating}) [ID: ${id}]`);
  }

  // Send to telemetry endpoint if configured
  if (typeof window !== "undefined" && (window as any).gtag) {
    (window as any).gtag("event", name, {
      value: Math.round(name === "CLS" ? value * 1000 : value),
      event_category: "Web Vitals",
      event_label: id,
      non_interaction: true,
    });
  }
}
