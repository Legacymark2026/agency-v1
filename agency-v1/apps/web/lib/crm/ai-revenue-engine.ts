/**
 * apps/web/lib/crm/ai-revenue-engine.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Motor de Inteligencia Artificial & Revenue Intelligence para el CRM.
 *
 * PROPORCIONA:
 * 1. Predictive Win Probability Engine (Cálculo ponderado ML/Heurístico)
 * 2. Next Best Action (NBA) Recommendation Engine
 * 3. Sentiment & Intent NLP Classifier (WhatsApp / Email)
 * 4. Stagnation Risk & Anomaly Detector
 */

export interface DealData {
    id: string;
    title: string;
    value: number;
    stage: string; // e.g. "Lead Qualification", "Proposal Sent", "Negotiation", "Closed Won", "Closed Lost"
    daysInStage: number;
    avgStageDuration?: number;
    interactionCount: number;
    daysSinceLastActivity: number;
    leadSource?: string; // "Google Ads", "LinkedIn", "Organic", "Referral", "Direct"
    leadScore?: number; // 0-100
}

export interface WinProbabilityResult {
    winProbability: number; // 0 - 100%
    confidence: 'HIGH' | 'MEDIUM' | 'LOW';
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    drivers: Array<{ name: string; impact: 'POSITIVE' | 'NEGATIVE'; weight: number }>;
}

export interface NextBestAction {
    action: string;
    description: string;
    recommendedChannel: 'WHATSAPP' | 'EMAIL' | 'CALL' | 'MEETING';
    expectedImpact: string; // e.g. "+15% Win Rate"
    urgency: 'IMMEDIATE' | 'HIGH' | 'MEDIUM' | 'LOW';
    confidenceScore: number; // 0 - 100%
}

export type SentimentType = 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE' | 'URGENT' | 'HESITANT';
export type IntentType = 'PURCHASE_INTENT' | 'INQUIRY' | 'PRICE_OBJECTION' | 'COMPLAINT' | 'SCHEDULING';

export interface SentimentResult {
    sentiment: SentimentType;
    intent: IntentType;
    urgency: 'URGENT' | 'NORMAL';
    score: number; // -1.0 (Muy negativo) a +1.0 (Muy positivo)
    detectedKeywords: string[];
}

export interface StagnationRiskResult {
    isStagnant: boolean;
    riskScore: number; // 0 - 100
    daysOverdue: number;
    recommendation: string;
}

// ── 1. PREDICTIVE WIN PROBABILITY ENGINE ──────────────────────────────────────

const STAGE_BASE_PROBABILITIES: Record<string, number> = {
    'Lead Qualification': 20,
    'Contacted': 35,
    'Proposal Sent': 60,
    'Negotiation': 80,
    'Closed Won': 100,
    'Closed Lost': 0,
};

export function calculateWinProbability(deal: DealData): WinProbabilityResult {
    if (deal.stage === 'Closed Won') {
        return { winProbability: 100, confidence: 'HIGH', riskLevel: 'LOW', drivers: [{ name: 'Trato Ganado', impact: 'POSITIVE', weight: 100 }] };
    }
    if (deal.stage === 'Closed Lost') {
        return { winProbability: 0, confidence: 'HIGH', riskLevel: 'CRITICAL', drivers: [{ name: 'Trato Perdido', impact: 'NEGATIVE', weight: -100 }] };
    }

    let baseScore = STAGE_BASE_PROBABILITIES[deal.stage] ?? 40;
    const drivers: Array<{ name: string; impact: 'POSITIVE' | 'NEGATIVE'; weight: number }> = [];

    // Factor 1: Interacciones recientes (Engagement velocity)
    if (deal.interactionCount >= 5) {
        baseScore += 12;
        drivers.push({ name: 'Alto nivel de interacción con cliente', impact: 'POSITIVE', weight: 12 });
    } else if (deal.interactionCount === 0) {
        baseScore -= 15;
        drivers.push({ name: 'Sin interacciones registradas', impact: 'NEGATIVE', weight: -15 });
    }

    // Factor 2: Tiempo de inactividad (Recency decay)
    if (deal.daysSinceLastActivity <= 2) {
        baseScore += 8;
        drivers.push({ name: 'Actividad reciente (<48h)', impact: 'POSITIVE', weight: 8 });
    } else if (deal.daysSinceLastActivity > 7) {
        const penalty = Math.min(25, (deal.daysSinceLastActivity - 7) * 3);
        baseScore -= penalty;
        drivers.push({ name: `Inactividad prolongada (${deal.daysSinceLastActivity} días)`, impact: 'NEGATIVE', weight: -penalty });
    }

    // Factor 3: Tiempo excesivo en la misma etapa
    const avgDuration = deal.avgStageDuration ?? 10;
    if (deal.daysInStage > avgDuration * 1.5) {
        baseScore -= 18;
        drivers.push({ name: `Estancado en etapa (${deal.daysInStage}d vs prom ${avgDuration}d)`, impact: 'NEGATIVE', weight: -18 });
    }

    // Factor 4: Lead Score previo o Lead Source de alta conversión
    if (deal.leadScore && deal.leadScore >= 80) {
        baseScore += 10;
        drivers.push({ name: 'Lead Score de alta calificación', impact: 'POSITIVE', weight: 10 });
    }
    if (deal.leadSource === 'Referral' || deal.leadSource === 'Direct') {
        baseScore += 8;
        drivers.push({ name: 'Canal de origen de alta conversión', impact: 'POSITIVE', weight: 8 });
    }

    // Clamping 5 - 95%
    const winProbability = Math.max(5, Math.min(95, Math.round(baseScore)));

    // Determinar nivel de confianza y riesgo
    const confidence = deal.interactionCount >= 3 ? 'HIGH' : deal.interactionCount >= 1 ? 'MEDIUM' : 'LOW';
    let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';
    if (winProbability < 25 || deal.daysSinceLastActivity > 14) riskLevel = 'CRITICAL';
    else if (winProbability < 45 || deal.daysSinceLastActivity > 7) riskLevel = 'HIGH';
    else if (winProbability < 65) riskLevel = 'MEDIUM';

    return { winProbability, confidence, riskLevel, drivers };
}

// ── 2. NEXT BEST ACTION (NBA) RECOMMENDATION ENGINE ─────────────────────────

export function predictNextBestAction(deal: DealData, recentInteractions: number = 0): NextBestAction {
    const { winProbability, riskLevel } = calculateWinProbability(deal);

    // Caso A: Inactividad crítica
    if (deal.daysSinceLastActivity >= 7) {
        return {
            action: 'Enviar Plantilla de Reactivación Rápida',
            description: `El trato lleva ${deal.daysSinceLastActivity} días sin actividad. Envía un mensaje directo por WhatsApp para validar interés.`,
            recommendedChannel: 'WHATSAPP',
            expectedImpact: '+18% Probabilidad de recuperación',
            urgency: 'IMMEDIATE',
            confidenceScore: 92,
        };
    }

    // Caso B: Etapa de Negociación o Propuesta
    if (deal.stage === 'Negotiation' || deal.stage === 'Proposal Sent') {
        if (deal.daysInStage >= 4) {
            return {
                action: 'Programar Llamada de Cierre o Resolver Objeciones de Precio',
                description: 'La propuesta fue enviada hace más de 4 días. Programa una sesión de 15 minutos para agilizar la firma.',
                recommendedChannel: 'CALL',
                expectedImpact: '+25% Tasa de Cierre',
                urgency: 'HIGH',
                confidenceScore: 88,
            };
        }
        return {
            action: 'Enviar Caso de Éxito / Testimonio de Cliente Similar',
            description: 'Envía un estudio de caso en PDF o video por correo para reforzar la propuesta de valor.',
            recommendedChannel: 'EMAIL',
            expectedImpact: '+12% Aumento de Confianza',
            urgency: 'MEDIUM',
            confidenceScore: 82,
        };
    }

    // Caso C: Calificación inicial
    if (deal.stage === 'Lead Qualification' || deal.stage === 'Contacted') {
        return {
            action: 'Agendar Demo Interactiva o Sesión Diagnóstico',
            description: 'El prospecto muestra interés inicial. Invítalo a una videollamada interactiva para evaluar sus necesidades.',
            recommendedChannel: 'MEETING',
            expectedImpact: '+30% Avance a Propuesta',
            urgency: 'HIGH',
            confidenceScore: 90,
        };
    }

    // Default Fallback
    return {
        action: 'Registrar Nota de Seguimiento y Próximo Hito',
        description: 'Actualiza el estado del prospecto y define la fecha del siguiente punto de contacto.',
        recommendedChannel: 'WHATSAPP',
        expectedImpact: '+8% Organización',
        urgency: 'LOW',
        confidenceScore: 75,
    };
}

// ── 3. SENTIMENT & INTENT NLP CLASSIFIER ─────────────────────────────────────

const POSITIVE_WORDS = ['excelente', 'perfecto', 'me interesa', 'comprar', 'precios', 'contratar', 'listo', 'avanzar', 'si', 'sí', 'bueno', 'genial'];
const NEGATIVE_WORDS = ['caro', 'no puedo', 'cancelar', 'no me interesa', 'malo', 'tarde', 'error', 'problema', 'descuento demasiado', 'no gracias'];
const URGENT_WORDS = ['urgente', 'hoy', 'asap', 'cuanto antes', 'ahora', 'inmediato', 'llamame', 'llámame'];

export function analyzeTextSentiment(message: string): SentimentResult {
    const cleanText = message.toLowerCase().trim();
    const words = cleanText.split(/\s+/);

    let score = 0;
    const detectedKeywords: string[] = [];

    POSITIVE_WORDS.forEach(word => {
        if (cleanText.includes(word)) {
            score += 0.35;
            detectedKeywords.push(word);
        }
    });

    NEGATIVE_WORDS.forEach(word => {
        if (cleanText.includes(word)) {
            score -= 0.4;
            detectedKeywords.push(word);
        }
    });

    const isUrgent = URGENT_WORDS.some(u => cleanText.includes(u));
    if (isUrgent) {
        detectedKeywords.push('urgente');
    }

    // Clamping score between -1.0 and 1.0
    score = Math.max(-1.0, Math.min(1.0, parseFloat(score.toFixed(2))));

    // Determine Sentiment Category
    let sentiment: SentimentType = 'NEUTRAL';
    if (score >= 0.3) sentiment = 'POSITIVE';
    else if (score <= -0.3) sentiment = 'NEGATIVE';
    else if (cleanText.includes('duda') || cleanText.includes('tal vez') || cleanText.includes('pensar')) sentiment = 'HESITANT';

    if (isUrgent && sentiment !== 'NEGATIVE') {
        sentiment = 'URGENT';
    }

    // Determine Intent Category
    let intent: IntentType = 'INQUIRY';
    if (cleanText.includes('precio') || cleanText.includes('cuanto cuesta') || cleanText.includes('costo') || cleanText.includes('caro')) {
        intent = cleanText.includes('caro') ? 'PRICE_OBJECTION' : 'INQUIRY';
    } else if (cleanText.includes('comprar') || cleanText.includes('contratar') || cleanText.includes('factura') || cleanText.includes('pago')) {
        intent = 'PURCHASE_INTENT';
    } else if (cleanText.includes('reunion') || cleanText.includes('reunión') || cleanText.includes('cita') || cleanText.includes('agenda')) {
        intent = 'SCHEDULING';
    } else if (score < -0.4) {
        intent = 'COMPLAINT';
    }

    return {
        sentiment,
        intent,
        urgency: isUrgent ? 'URGENT' : 'NORMAL',
        score,
        detectedKeywords,
    };
}

// ── 4. STAGNATION RISK & ANOMALY DETECTOR ────────────────────────────────────

export function evaluateStagnationRisk(daysInCurrentStage: number, avgStageDuration: number = 7): StagnationRiskResult {
    const ratio = daysInCurrentStage / Math.max(1, avgStageDuration);
    const daysOverdue = Math.max(0, daysInCurrentStage - avgStageDuration);

    let isStagnant = false;
    let riskScore = 0;
    let recommendation = 'Trato dentro del flujo normal de etapa.';

    if (ratio >= 2.0) {
        isStagnant = true;
        riskScore = 90;
        recommendation = `ALERTA CRÍTICA: Trato estancado ${daysOverdue} días por encima del promedio. Se requiere intervención directa de ventas.`;
    } else if (ratio >= 1.4) {
        isStagnant = true;
        riskScore = 65;
        recommendation = `Advertencia de estancamiento: ${daysOverdue} días excedidos. Se sugiere enviar un seguimiento interactivo.`;
    } else if (ratio >= 1.1) {
        riskScore = 35;
        recommendation = 'Trato cercano al límite promedio de tiempo en etapa.';
    }

    return { isStagnant, riskScore, daysOverdue, recommendation };
}
