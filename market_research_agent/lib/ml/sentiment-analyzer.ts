/**
 * lib/ml/sentiment-analyzer.ts
 * ─────────────────────────────────────────────────────────────
 * Analizador de Sentimiento y Fatiga Publicitaria (NLP).
 * 
 * Este servicio procesa comentarios en redes sociales (Facebook, 
 * Instagram, TikTok) o respuestas a correos masivos para
 * determinar si una campaña está sufriendo de "Ad Fatigue" 
 * (rechazo por repetición).
 */

// import { generateObject } from 'ai';
// import { google } from '@ai-sdk/google';
// import { z } from 'zod';

export interface SentimentAnalysisResult {
    score: number; // -1.0 (Muy Negativo) a 1.0 (Muy Positivo)
    category: "POSITIVE" | "NEUTRAL" | "NEGATIVE" | "FATIGUE" | "SPAM";
    confidence: number; // 0.0 - 1.0 porcentaje de seguridad del modelo
    detectedKeywords: string[];
    isAdFatigue: boolean;
}

export class SentimentAnalyzer {
    /**
     * Analiza un lote de textos (comentarios) para determinar la
     * salud general de una campaña/anuncio.
     * 
     * @param texts Array de comentarios extraídos de la campaña.
     * @returns Métrica agregada + Resultados individuales.
     */
    static async analyzeCampaignComments(texts: string[]): Promise<{
        overallHealthScore: number;
        fatigueWarning: boolean;
        results: SentimentAnalysisResult[];
    }> {
        if (!texts || texts.length === 0) {
            return { overallHealthScore: 0, fatigueWarning: false, results: [] };
        }

        // Mocking the AI SDK `generateObject` call that would normally process this.
        // En producción, esto enviaría el array (o una muestra estadística si es muy grande)
        // a Gemini 2.0 Flash o Claude 3.5 Sonnet para un análisis estructural usando JSON Schema (Zod).

        console.log(`[ML] Iniciando análisis NLP para ${texts.length} comentarios...`);
        
        let fatigueCount = 0;
        let cumulativeScore = 0;
        
        const results: SentimentAnalysisResult[] = texts.map(text => {
            const lower = text.toLowerCase();
            let category: "POSITIVE" | "NEUTRAL" | "NEGATIVE" | "FATIGUE" | "SPAM" = "NEUTRAL";
            let score = 0;
            let isAdFatigue = false;

            // Simple heuristic mock para la demostración
            if (lower.match(/ya lo vi|otra vez|deja de salirme|hart|cansad|spam/gi)) {
                category = "FATIGUE";
                score = -0.8;
                isAdFatigue = true;
                fatigueCount++;
            } else if (lower.match(/excelente|buenísimo|precio|info|me interesa/gi)) {
                category = "POSITIVE";
                score = 0.9;
            } else if (lower.match(/estafa|malo|no sirve/gi)) {
                category = "NEGATIVE";
                score = -0.9;
            }

            cumulativeScore += score;

            return {
                score,
                category,
                confidence: 0.95,
                detectedKeywords: [],
                isAdFatigue
            };
        });

        // Calcular Score Global Normalizado (-100 a +100)
        const avgScore = cumulativeScore / texts.length;
        const normalizedHealth = Math.round(avgScore * 100);

        // Disparar Alerta de Fatiga si > 15% de los comentarios son del tipo "FATIGUE"
        const fatigueRatio = fatigueCount / texts.length;
        const fatigueWarning = fatigueRatio > 0.15;

        if (fatigueWarning) {
            console.warn(`🚨 [ML ALERT] Ad Fatigue detectada! Ratio: ${(fatigueRatio * 100).toFixed(1)}%. Se recomienda pausar creativo.`);
        }

        return {
            overallHealthScore: normalizedHealth,
            fatigueWarning,
            results
        };
    }
}
