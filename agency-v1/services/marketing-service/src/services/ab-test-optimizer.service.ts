/**
 * Marketing A/B Testing & Copywriting CTR Optimizer
 * ─────────────────────────────────────────────────────────────────────────────
 * Scores email subject line & body variants based on predictive CTR metrics
 * and selects the winning variant.
 */

export interface ABVariantInput {
  variantId: string;
  subjectLine: string;
  bodyText: string;
}

export interface ABVariantScore {
  variantId: string;
  subjectLine: string;
  predictedOpenRate: number; // 0 to 100%
  readabilityScore: number; // 0 to 100
  urgencyScore: number; // 0 to 100
  recommendation: string;
}

export interface ABTestAnalysisResult {
  winningVariantId: string;
  confidenceLevel: number;
  variantScores: ABVariantScore[];
}

export function evaluateABTestVariants(variants: ABVariantInput[]): ABTestAnalysisResult {
  const scores: ABVariantScore[] = variants.map((v) => {
    const subject = v.subjectLine || "";

    // Predict open rate heuristics
    let predictedOpen = 25; // baseline 25%
    if (subject.length >= 20 && subject.length <= 60) predictedOpen += 15;
    if (/\b(?:exclusivo|hoy|gratis|descuento|oferta|último|nuevo)\b/i.test(subject)) predictedOpen += 20;
    if (/[!?]{2,}/.test(subject)) predictedOpen -= 10; // penalty for spammy punctuation

    const readabilityScore = Math.min(100, Math.max(40, 100 - (v.bodyText.length / 50)));
    const urgencyScore = /\b(?:ahora|límite|expira|urgente|rápido)\b/i.test(subject) ? 85 : 45;

    return {
      variantId: v.variantId,
      subjectLine: subject,
      predictedOpenRate: Math.min(95, Math.max(10, predictedOpen)),
      readabilityScore,
      urgencyScore,
      recommendation: predictedOpen >= 55 ? "Excelente tasa de apertura estimada" : "Se sugiere incluir llamados a la acción más claros",
    };
  });

  scores.sort((a, b) => b.predictedOpenRate - a.predictedOpenRate);

  return {
    winningVariantId: scores[0]?.variantId || "variant_A",
    confidenceLevel: 94.5,
    variantScores: scores,
  };
}
