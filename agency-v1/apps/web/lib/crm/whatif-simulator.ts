/**
 * apps/web/lib/crm/whatif-simulator.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Simulador de Escenarios de Ingresos "What-If" para el CRM.
 *
 * Permite proyectar el impacto financiero de variaciones en la tasa de conversión,
 * volumen de leads, ticket promedio y tamaño del equipo de ventas.
 */

export interface BaselineRevenueConfig {
    monthlyLeads: number;
    conversionRate: number; // e.g. 5.0 for 5%
    avgDealSize: number;
    salesReps: number;
}

export interface WhatIfParameters {
    leadVolumeChangePct: number; // e.g. +20%
    conversionRateDeltaPct: number; // e.g. +2% (making it 7%)
    dealSizeChange: number; // e.g. +500
    salesRepChange: number; // e.g. +2 reps
}

export interface SimulationResult {
    baselineMonthlyRevenue: number;
    projectedMonthlyRevenue: number;
    revenueDelta: number;
    growthPercentage: number;
    baselineDealsWon: number;
    projectedDealsWon: number;
    insightSummary: string;
}

export function simulateWhatIfRevenue(
    baseline: BaselineRevenueConfig,
    params: WhatIfParameters
): SimulationResult {
    // 1. Baseline Calculations
    const baselineDealsWon = Math.round(baseline.monthlyLeads * (baseline.conversionRate / 100));
    const baselineMonthlyRevenue = baselineDealsWon * baseline.avgDealSize;

    // 2. Projected Parameters
    const projectedLeads = Math.round(baseline.monthlyLeads * (1 + params.leadVolumeChangePct / 100));
    const projectedConvRate = Math.max(0.1, baseline.conversionRate + params.conversionRateDeltaPct);
    const projectedDealSize = Math.max(1, baseline.avgDealSize + params.dealSizeChange);
    const totalReps = Math.max(1, baseline.salesReps + params.salesRepChange);
    const repCapacityFactor = totalReps / Math.max(1, baseline.salesReps);

    // 3. Projected Deals Won (adjusted by sales rep capacity)
    const rawProjectedDeals = projectedLeads * (projectedConvRate / 100);
    const projectedDealsWon = Math.round(rawProjectedDeals * Math.min(1.5, repCapacityFactor));
    const projectedMonthlyRevenue = projectedDealsWon * projectedDealSize;

    // 4. Growth calculations
    const revenueDelta = projectedMonthlyRevenue - baselineMonthlyRevenue;
    const growthPercentage = baselineMonthlyRevenue > 0
        ? parseFloat(((revenueDelta / baselineMonthlyRevenue) * 100).toFixed(1))
        : 0;

    let insightSummary = 'Escenario conservador sin cambios significativos.';
    if (growthPercentage >= 50) {
        insightSummary = `🚀 ESCENARIO DE ALTO CRECIMIENTO: Un incremento del ${growthPercentage}% generaría +$${revenueDelta.toLocaleString()} mensuales adicionales.`;
    } else if (growthPercentage >= 20) {
        insightSummary = `📈 ESCENARIO OPTIMISTA: Generaría un aumento del ${growthPercentage}% en la facturación mensual.`;
    } else if (growthPercentage < 0) {
        insightSummary = `⚠️ ESCENARIO EN RIESGO: Se proyecta una reducción del ${Math.abs(growthPercentage)}% en los ingresos.`;
    }

    return {
        baselineMonthlyRevenue,
        projectedMonthlyRevenue,
        revenueDelta,
        growthPercentage,
        baselineDealsWon,
        projectedDealsWon,
        insightSummary,
    };
}
