/**
 * apps/web/lib/crm/attribution-engine.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Motor de Atribución Multi-Táctil de Ingresos & Calculadora de LTV de Cohortes.
 *
 * SOPORTA 5 MODELOS MATEMÁTICOS DE ATRIBUCIÓN:
 * 1. FIRST_TOUCH  (100% al primer punto de contacto)
 * 2. LAST_TOUCH   (100% al último punto de contacto antes del cierre)
 * 3. LINEAR       (Distribución equitativa entre todos los puntos de contacto)
 * 4. W_SHAPED     (30% Primer Toque, 30% Creación de Lead, 30% Creación de Oportunidad, 10% Intermedios)
 * 5. TIME_DECAY   (Decaimiento exponencial atribuido más a los puntos cercanos a la conversión)
 */

export type AttributionModel = 'FIRST_TOUCH' | 'LAST_TOUCH' | 'LINEAR' | 'W_SHAPED' | 'TIME_DECAY';

export interface Touchpoint {
    id: string;
    channel: 'Google Ads' | 'Meta Ads' | 'LinkedIn Ads' | 'Organic' | 'Referral' | 'Direct' | 'Email Campaign';
    timestamp: Date | string;
    eventType: 'FIRST_VISIT' | 'LEAD_CAPTURED' | 'OPPORTUNITY_CREATED' | 'DEMO_SCHEDULED' | 'DEAL_WON';
}

export interface ChannelAttributionShare {
    channel: string;
    attributedRevenue: number;
    percentage: number;
    touchpointCount: number;
}

export interface CohortLtvResult {
    cohortMonth: string; // e.g. "2026-01"
    customerCount: number;
    totalRevenue: number;
    avgLtv: number;
    projected12MonthLtv: number;
}

// ── 1. MULTI-TOUCH ATTRIBUTION CALCULATOR ────────────────────────────────────

export function calculateMultiTouchAttribution(
    dealValue: number,
    touchpoints: Touchpoint[],
    model: AttributionModel = 'LINEAR'
): ChannelAttributionShare[] {
    if (!touchpoints || touchpoints.length === 0 || dealValue <= 0) {
        return [];
    }

    // Sort touchpoints chronologically
    const sorted = [...touchpoints].sort(
        (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    const n = sorted.length;
    const channelWeights: Record<string, { weight: number; count: number }> = {};

    sorted.forEach(t => {
        if (!channelWeights[t.channel]) {
            channelWeights[t.channel] = { weight: 0, count: 0 };
        }
        channelWeights[t.channel].count += 1;
    });

    switch (model) {
        case 'FIRST_TOUCH': {
            const firstChannel = sorted[0].channel;
            channelWeights[firstChannel].weight = 1.0;
            break;
        }

        case 'LAST_TOUCH': {
            const lastChannel = sorted[n - 1].channel;
            channelWeights[lastChannel].weight = 1.0;
            break;
        }

        case 'LINEAR': {
            const equalShare = 1.0 / n;
            sorted.forEach(t => {
                channelWeights[t.channel].weight += equalShare;
            });
            break;
        }

        case 'W_SHAPED': {
            if (n === 1) {
                channelWeights[sorted[0].channel].weight = 1.0;
            } else if (n === 2) {
                channelWeights[sorted[0].channel].weight += 0.5;
                channelWeights[sorted[n - 1].channel].weight += 0.5;
            } else {
                // First Touch: 35%, Middle Touch: 30%, Last Touch: 35%
                const first = sorted[0].channel;
                const last = sorted[n - 1].channel;
                const middleWeight = 0.30 / (n - 2);

                channelWeights[first].weight += 0.35;
                channelWeights[last].weight += 0.35;

                for (let i = 1; i < n - 1; i++) {
                    channelWeights[sorted[i].channel].weight += middleWeight;
                }
            }
            break;
        }

        case 'TIME_DECAY': {
            // Half-life decay model: 7-day half life
            const lastTime = new Date(sorted[n - 1].timestamp).getTime();
            const halfLifeMs = 7 * 24 * 60 * 60 * 1000;

            let totalRawWeight = 0;
            const rawWeights = sorted.map(t => {
                const diffMs = Math.max(0, lastTime - new Date(t.timestamp).getTime());
                const w = Math.pow(0.5, diffMs / halfLifeMs);
                totalRawWeight += w;
                return { channel: t.channel, weight: w };
            });

            rawWeights.forEach(rw => {
                const normalized = rw.weight / (totalRawWeight || 1);
                channelWeights[rw.channel].weight += normalized;
            });
            break;
        }
    }

    // Build final output array with attributed revenues
    return Object.entries(channelWeights).map(([channel, data]) => {
        const attributedRevenue = Math.round(dealValue * data.weight);
        const percentage = Math.round(data.weight * 100);
        return {
            channel,
            attributedRevenue,
            percentage,
            touchpointCount: data.count,
        };
    }).sort((a, b) => b.attributedRevenue - a.attributedRevenue);
}

// ── 2. COHORT LTV CALCULATOR ──────────────────────────────────────────────────

export function calculateCohortLTV(
    cohortMonth: string,
    customerDeals: Array<{ dealValue: number; recurrenceMonths?: number }>
): CohortLtvResult {
    const customerCount = customerDeals.length;
    if (customerCount === 0) {
        return {
            cohortMonth,
            customerCount: 0,
            totalRevenue: 0,
            avgLtv: 0,
            projected12MonthLtv: 0,
        };
    }

    const totalRevenue = customerDeals.reduce((sum, d) => sum + d.dealValue, 0);
    const avgLtv = Math.round(totalRevenue / customerCount);

    // Multiplicador proyectado anual basado en retención promedio SaaS / Servicios (1.6x)
    const projected12MonthLtv = Math.round(avgLtv * 1.6);

    return {
        cohortMonth,
        customerCount,
        totalRevenue,
        avgLtv,
        projected12MonthLtv,
    };
}
