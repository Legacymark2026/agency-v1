/**
 * modules/analytics/actions/bi-tenant.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Nivel 3B: Business Intelligence por Tenant
 *
 * Cada empresa ve exclusivamente sus propios KPIs del CRM.
 * Los datos están aislados por companyId usando unstable_cache con
 * cache tags específicos por tenant, permitiendo invalidación granular.
 *
 * DATOS PROPIOS DEL TENANT (desde su CRM):
 *  - Revenue: deals ganados este mes vs mes anterior
 *  - Pipeline: valor de oportunidades activas
 *  - Leads: volumen y tasa de conversión
 *  - Win Rate y Avg Deal Size
 *  - Forecast: próximos 3 meses ponderado por probabilidad
 *  - Top Agents: leaderboard de ventas
 *  - Lead Sources: de dónde vienen sus leads
 *  - Funnel: Sesiones → Leads → Deals → Won
 */

'use server';

import { prisma } from "@/lib/prisma";
import { unstable_cache } from 'next/cache';
import { subDays, startOfMonth, endOfMonth, format } from 'date-fns';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TenantKpiSnapshot {
  /** Revenue de deals ganados en el mes actual */
  revenueCurrentMonth: number;
  /** Revenue del mes anterior */
  revenueLastMonth: number;
  /** % de cambio MoM */
  revenueMomPct: number;

  /** Valor total del pipeline activo */
  pipelineValue: number;
  /** # de deals activos */
  pipelineCount: number;

  /** # de leads este mes */
  leadsThisMonth: number;
  /** # de leads mes anterior */
  leadsLastMonth: number;
  /** % de cambio leads MoM */
  leadsMomPct: number;

  /** Win rate % (WON / WON+LOST) */
  winRate: number;
  /** Valor promedio de deal ganado */
  avgDealSize: number;
  /** Días promedio para cerrar un deal */
  avgDaysToClose: number;

  /** Forecast ponderado de los próximos 3 meses */
  forecastData: { name: string; weighted: number; total: number }[];
  forecastTotal: number;

  /** Top 5 agentes por revenue */
  leaderboard: { name: string; wonValue: number; dealCount: number }[];

  /** Fuentes de leads */
  leadSources: { name: string; value: number; pct: number }[];

  /** Embudo cross: sesiones web → leads → deals → won */
  funnel: { stage: string; count: number; pct: number; color: string }[];

  /** Deals estancados (sin actualizar en 30+ días) */
  stagnantDeals: number;

  /** Actividad reciente (# actividades en los últimos 7 días) */
  recentActivity: number;

  /** Meta de ventas mensual */
  monthlyTarget: number;
  /** % progreso hacia la meta */
  goalProgress: number;
}

// ─── Main cached function ─────────────────────────────────────────────────────

/**
 * Obtiene el snapshot completo de BI para un tenant específico.
 * Cache por companyId con TTL de 5 minutos.
 * Tag: `bi:${companyId}` — permite invalidación granular al ganar un deal.
 */
export async function getTenantBISnapshot(companyId: string): Promise<TenantKpiSnapshot> {
  if (!companyId) throw new Error('companyId requerido para BI snapshot');

  // Crear cache con tag específico por tenant
  const cached = unstable_cache(
    () => _fetchTenantBI(companyId),
    [`bi-snapshot-${companyId}`],
    {
      revalidate: 300, // 5 minutos
      tags: [`bi:${companyId}`, 'bi:all'],
    }
  );
  return cached();
}

/**
 * Invalida el cache de BI para un tenant.
 * Llamar tras: crear deal, cambiar stage a WON, crear lead.
 */
export async function invalidateTenantBI(companyId: string) {
  const { revalidateTag } = await import('next/cache');
  revalidateTag(`bi:${companyId}`);
}

// ─── Private fetcher ──────────────────────────────────────────────────────────

async function _fetchTenantBI(companyId: string): Promise<TenantKpiSnapshot> {
  const today = new Date();
  const monthStart = startOfMonth(today);
  const monthEnd = endOfMonth(today);
  const lastMonthStart = startOfMonth(subDays(today, 1));
  // Corrección: el inicio del mes pasado
  const prevMonthStart = startOfMonth(subDays(monthStart, 1));
  const prevMonthEnd = endOfMonth(subDays(monthStart, 1));
  const thirtyDaysAgo = subDays(today, 30);

  const forecastMonths = [
    { start: startOfMonth(today),               end: endOfMonth(today),               name: format(today, 'MMM') },
    { start: startOfMonth(subDays(today, -30)), end: endOfMonth(subDays(today, -30)), name: format(subDays(today, -30), 'MMM') },
    { start: startOfMonth(subDays(today, -60)), end: endOfMonth(subDays(today, -60)), name: format(subDays(today, -60), 'MMM') },
  ];

  // ── Una sola mega Promise.all — cero waterfalls ────────────────────────────
  const [
    wonDealsMonth,
    wonDealsPrevMonth,
    wonDealsAll,
    lostDealsCount,
    pipelineDeals,
    leadsThisMonth,
    leadsLastMonth,
    leaderboardRaw,
    leadSourcesRaw,
    stagnantCount,
    activityCount,
    allForecastDeals,
    totalLeadsCount,
  ] = await Promise.all([
    // Revenue mes actual
    prisma.deal.aggregate({
      where: { companyId, stage: 'WON', updatedAt: { gte: monthStart, lte: monthEnd } },
      _sum: { value: true },
      _count: { id: true },
    }),
    // Revenue mes anterior
    prisma.deal.aggregate({
      where: { companyId, stage: 'WON', updatedAt: { gte: prevMonthStart, lte: prevMonthEnd } },
      _sum: { value: true },
    }),
    // Todos los deals ganados (para avgDaysToClose y avgDealSize)
    prisma.deal.findMany({
      where: { companyId, stage: 'WON' },
      select: { value: true, createdAt: true, updatedAt: true },
    }),
    // Count deals perdidos (para win rate)
    prisma.deal.count({ where: { companyId, stage: 'LOST' } }),
    // Pipeline activo
    prisma.deal.aggregate({
      where: { companyId, stage: { notIn: ['WON', 'LOST'] } },
      _sum: { value: true },
      _count: { id: true },
    }),
    // Leads este mes
    prisma.lead.count({ where: { companyId, createdAt: { gte: monthStart, lte: monthEnd } } }),
    // Leads mes anterior
    prisma.lead.count({ where: { companyId, createdAt: { gte: prevMonthStart, lte: prevMonthEnd } } }),
    // Leaderboard: groupBy assignedTo
    prisma.deal.groupBy({
      by: ['assignedTo'],
      where: { companyId, stage: 'WON', assignedTo: { not: null } },
      _sum: { value: true },
      _count: { id: true },
      orderBy: { _sum: { value: 'desc' } },
      take: 5,
    }),
    // Lead sources
    prisma.lead.groupBy({
      by: ['source'],
      where: { companyId, source: { not: null } },
      _count: { source: true },
      orderBy: { _count: { source: 'desc' } },
      take: 8,
    }),
    // Deals estancados
    prisma.deal.count({
      where: { companyId, stage: { notIn: ['WON', 'LOST'] }, updatedAt: { lt: thirtyDaysAgo } },
    }),
    // Actividad reciente (7 días)
    prisma.cRMActivity.count({
      where: { companyId, createdAt: { gte: subDays(today, 7) } },
    }),
    // Forecast: todos los deals activos con expectedClose en ventana
    prisma.deal.findMany({
      where: {
        companyId,
        stage: { notIn: ['WON', 'LOST'] },
        expectedClose: { gte: forecastMonths[0].start, lte: forecastMonths[2].end },
      },
      select: { value: true, probability: true, expectedClose: true },
    }),
    // Total leads para funnel
    prisma.lead.count({ where: { companyId } }),
  ]);

  // ── Enriquecer leaderboard con nombres ─────────────────────────────────────
  const userIds = leaderboardRaw.map(r => r.assignedTo).filter((id): id is string => !!id);
  const users = userIds.length > 0
    ? await prisma.user.findMany({ where: { id: { in: userIds } }, select: { id: true, name: true } })
    : [];
  const nameMap = new Map(users.map(u => [u.id, u.name]));

  // ── Calcular KPIs ──────────────────────────────────────────────────────────
  const revenueCurrentMonth = wonDealsMonth._sum.value ?? 0;
  const revenueLastMonth    = wonDealsPrevMonth._sum.value ?? 0;
  const revenueMomPct       = revenueLastMonth > 0
    ? Math.round(((revenueCurrentMonth - revenueLastMonth) / revenueLastMonth) * 100)
    : revenueCurrentMonth > 0 ? 100 : 0;

  const wonCount   = wonDealsAll.length;
  const winRate    = wonCount + lostDealsCount > 0
    ? Math.round((wonCount / (wonCount + lostDealsCount)) * 100)
    : 0;
  const avgDealSize = wonCount > 0
    ? Math.round(wonDealsAll.reduce((s, d) => s + d.value, 0) / wonCount)
    : 0;
  const totalDays  = wonDealsAll.reduce((acc, d) => {
    return acc + Math.ceil(Math.abs(d.updatedAt.getTime() - d.createdAt.getTime()) / 86400000);
  }, 0);
  const avgDaysToClose = wonCount > 0 ? Math.round(totalDays / wonCount) : 0;

  const leadsMomPct = leadsLastMonth > 0
    ? Math.round(((leadsThisMonth - leadsLastMonth) / leadsLastMonth) * 100)
    : leadsThisMonth > 0 ? 100 : 0;

  // Forecast en memoria
  const forecastData = forecastMonths.map(month => {
    const deals = allForecastDeals.filter(d => d.expectedClose && d.expectedClose >= month.start && d.expectedClose <= month.end);
    return {
      name: month.name,
      weighted: Math.round(deals.reduce((acc, d) => acc + d.value * (d.probability / 100), 0)),
      total:    Math.round(deals.reduce((acc, d) => acc + d.value, 0)),
    };
  });
  const forecastTotal = forecastData.reduce((a, d) => a + d.weighted, 0);

  // Leaderboard
  const leaderboard = leaderboardRaw.map(r => ({
    name: nameMap.get(r.assignedTo!) || r.assignedTo || 'Sin asignar',
    wonValue: r._sum.value ?? 0,
    dealCount: r._count.id,
  }));

  // Lead sources con %
  const totalLeadsBySource = leadSourcesRaw.reduce((s, r) => s + r._count.source, 0);
  const leadSources = leadSourcesRaw.map(r => ({
    name: r.source || 'Directo',
    value: r._count.source,
    pct: totalLeadsBySource > 0 ? Math.round((r._count.source / totalLeadsBySource) * 100) : 0,
  }));

  // Funnel cross (web sessions no disponibles sin analyticsSession del tenant, usamos CRM data)
  const dealsTotal = (pipelineDeals._count.id ?? 0) + wonCount + lostDealsCount;
  const funnelBase = Math.max(totalLeadsCount, 1);
  const funnel = [
    { stage: 'Leads',        count: totalLeadsCount,          pct: 100,                                              color: '#8b5cf6' },
    { stage: 'Oportunidades',count: dealsTotal,               pct: Math.round((dealsTotal / funnelBase) * 100),      color: '#0d9488' },
    { stage: 'Pipeline',     count: pipelineDeals._count.id ?? 0, pct: Math.round(((pipelineDeals._count.id ?? 0) / funnelBase) * 100), color: '#3b82f6' },
    { stage: 'Ganados',      count: wonCount,                 pct: Math.round((wonCount / funnelBase) * 100),        color: '#22c55e' },
  ];

  // Meta mensual
  const monthlyTarget = parseInt(process.env.MONTHLY_SALES_TARGET ?? '50000', 10);
  const goalProgress  = Math.min(100, Math.round((revenueCurrentMonth / monthlyTarget) * 100));

  return {
    revenueCurrentMonth,
    revenueLastMonth,
    revenueMomPct,
    pipelineValue: pipelineDeals._sum.value ?? 0,
    pipelineCount: pipelineDeals._count.id ?? 0,
    leadsThisMonth,
    leadsLastMonth,
    leadsMomPct,
    winRate,
    avgDealSize,
    avgDaysToClose,
    forecastData,
    forecastTotal,
    leaderboard,
    leadSources,
    funnel,
    stagnantDeals: stagnantCount,
    recentActivity: activityCount,
    monthlyTarget,
    goalProgress,
  };
}
