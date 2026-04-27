/**
 * modules/analytics/components/bi-section-skeleton.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Nivel 3A: Skeletons para Streaming SSR
 *
 * Cada sección del dashboard tiene su propio skeleton que se muestra
 * mientras el Server Component carga en paralelo con Suspense.
 * Esto elimina el "loading spinner de página completa" y permite
 * que secciones más livianas carguen inmediatamente.
 */

"use client";

// ── Shimmer base ──────────────────────────────────────────────────────────────

function Shimmer({ className = "" }: { className?: string }) {
  return (
    <div
      className={`rounded-sm bg-slate-800/60 animate-pulse ${className}`}
      style={{ background: "linear-gradient(90deg, rgba(30,41,59,0.6) 25%, rgba(51,65,85,0.4) 50%, rgba(30,41,59,0.6) 75%)", backgroundSize: "200% 100%", animation: "shimmer 1.5s infinite" }}
    />
  );
}

// ── KPI Cards skeleton (4 tarjetas) ──────────────────────────────────────────

export function KpiCardsSkeleton() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="ds-card space-y-3">
          <Shimmer className="h-3 w-24" />
          <Shimmer className="h-7 w-32" />
          <Shimmer className="h-2.5 w-20" />
        </div>
      ))}
    </div>
  );
}

// ── Forecast skeleton ─────────────────────────────────────────────────────────

export function ForecastSkeleton() {
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <div className="ds-card lg:col-span-2 space-y-4">
        <Shimmer className="h-3 w-32" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="space-y-1.5">
            <div className="flex justify-between">
              <Shimmer className="h-3 w-10" />
              <Shimmer className="h-3 w-24" />
            </div>
            <Shimmer className="h-5 w-full" />
          </div>
        ))}
      </div>
      <div className="ds-card space-y-4">
        <Shimmer className="h-3 w-32" />
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex justify-between">
            <Shimmer className="h-3 w-24" />
            <Shimmer className="h-3 w-12" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Leaderboard + Sources skeleton ────────────────────────────────────────────

export function LeaderboardSkeleton() {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {Array.from({ length: 2 }).map((_, card) => (
        <div key={card} className="ds-card space-y-3">
          <Shimmer className="h-3 w-28" />
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="space-y-1.5">
              <div className="flex justify-between">
                <Shimmer className="h-3 w-32" />
                <Shimmer className="h-3 w-16" />
              </div>
              <Shimmer className="h-1.5 w-full" />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

// ── Funnel skeleton ───────────────────────────────────────────────────────────

export function FunnelSkeleton() {
  return (
    <div className="ds-card">
      <Shimmer className="h-3 w-28 mb-4" />
      <div className="grid grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-2 p-3 rounded-sm" style={{ border: "1px solid rgba(30,41,59,0.5)" }}>
            <Shimmer className="h-2.5 w-16 mx-auto" />
            <Shimmer className="h-6 w-12 mx-auto" />
            <Shimmer className="h-2 w-8 mx-auto" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Full BI dashboard skeleton ────────────────────────────────────────────────

export function BIDashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Shimmer className="h-4 w-24" />
          <Shimmer className="h-6 w-64" />
        </div>
        <Shimmer className="h-16 w-40 rounded-sm" />
      </div>
      <KpiCardsSkeleton />
      <ForecastSkeleton />
      <LeaderboardSkeleton />
      <FunnelSkeleton />
    </div>
  );
}

// ── Analytics section skeletons ───────────────────────────────────────────────

export function ChartSkeleton({ height = 200 }: { height?: number }) {
  return (
    <div className="ds-card">
      <Shimmer className="h-3 w-36 mb-5" />
      <Shimmer style={{ height }} />
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="ds-card space-y-3">
      <Shimmer className="h-3 w-36" />
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center justify-between py-2" style={{ borderBottom: "1px solid rgba(30,41,59,0.4)" }}>
          <div className="flex items-center gap-3">
            <Shimmer className="h-4 w-4 rounded-full" />
            <Shimmer className="h-3 w-32" />
          </div>
          <Shimmer className="h-3 w-16" />
        </div>
      ))}
    </div>
  );
}
