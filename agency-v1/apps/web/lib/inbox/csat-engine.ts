/**
 * apps/web/lib/inbox/csat-engine.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Motor de Encuestas Automáticas de Satisfacción (CSAT & NPS Survey Engine).
 *
 * Envía encuestas de satisfacción post-resolución (1 a 5 estrellas)
 * y calcula el CSAT % y Net Promoter Score por agente y canal.
 */

export interface CsatRating {
    id: string;
    conversationId: string;
    agentId: string;
    score: number; // 1 to 5
    feedbackText?: string;
    createdAt: string;
}

export interface CsatMetricsResult {
    totalSurveys: number;
    averageScore: number; // 1.0 - 5.0
    csatPercentage: number; // % of scores >= 4
    npsScore: number; // Net Promoter Score (-100 to +100)
    ratingDistribution: Record<number, number>; // { 1: 0, 2: 1, 3: 2, 4: 5, 5: 10 }
}

export function calculateCsatMetrics(ratings: CsatRating[]): CsatMetricsResult {
    if (!ratings || ratings.length === 0) {
        return {
            totalSurveys: 0,
            averageScore: 0,
            csatPercentage: 0,
            npsScore: 0,
            ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        };
    }

    const totalSurveys = ratings.length;
    let sumScore = 0;
    let satisfiedCount = 0; // scores 4 and 5
    let promotersCount = 0; // score 5
    let detractorsCount = 0; // scores 1, 2, 3

    const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

    ratings.forEach(r => {
        const score = Math.max(1, Math.min(5, Math.round(r.score)));
        sumScore += score;
        distribution[score] = (distribution[score] || 0) + 1;

        if (score >= 4) satisfiedCount++;
        if (score === 5) promotersCount++;
        if (score <= 3) detractorsCount++;
    });

    const averageScore = parseFloat((sumScore / totalSurveys).toFixed(2));
    const csatPercentage = parseFloat(((satisfiedCount / totalSurveys) * 100).toFixed(1));
    const npsScore = Math.round(((promotersCount - detractorsCount) / totalSurveys) * 100);

    return {
        totalSurveys,
        averageScore,
        csatPercentage,
        npsScore,
        ratingDistribution: distribution,
    };
}

export function generateCsatSurveyPayload(conversationId: string): { message: string; quickReplies: string[] } {
    return {
        message: '¿Cómo calificarías la atención recibida hoy por nuestro equipo?',
        quickReplies: ['⭐ 5 - Excelente', '⭐ 4 - Buena', '⭐ 3 - Regular', '⭐ 2 - Mala', '⭐ 1 - Pésima'],
    };
}
