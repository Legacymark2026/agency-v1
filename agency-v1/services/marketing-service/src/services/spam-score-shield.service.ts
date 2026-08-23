/**
 * AI Subject Line Optimizer & Spam Score Shield (Litmus / CoSchedule style)
 * ─────────────────────────────────────────────────────────────────────────────
 * Scans email subjects and content for spam trigger words, caps ratio, exclamation marks,
 * and calculates deliverability health scores (0-100) with predicted open rates.
 */

export interface SpamAuditResult {
  deliverabilityScore: number; // 0 to 100
  isSafeToSend: boolean;
  predictedOpenRate: number; // Percentage, e.g. 38%
  triggeredSpamKeywords: string[];
  formattingWarnings: string[];
  aiSubjectRecommendations: string[];
}

export class SpamScoreShieldService {
  private spamKeywords = [
    "gratis",
    "100% gratis",
    "dinero rápido",
    "hazte rico",
    "urgente",
    "oferta exclusiva",
    "garantizado",
    "gana dinero",
    "compra ahora",
    "sin riesgo",
    "$$$",
    "premio",
  ];

  /**
   * Evaluates subject line and body text for deliverability and spam risk.
   */
  public evaluateEmail(subject: string, bodyText: string): SpamAuditResult {
    const triggeredSpamKeywords: string[] = [];
    const formattingWarnings: string[] = [];
    let penalties = 0;

    const fullContent = `${subject} ${bodyText}`.toLowerCase();

    // 1. Check spam keywords
    for (const kw of this.spamKeywords) {
      if (fullContent.includes(kw)) {
        triggeredSpamKeywords.push(kw);
        penalties += 15;
      }
    }

    // 2. Check all-caps ratio in subject
    const upperChars = subject.replace(/[^A-Z]/g, "").length;
    const totalChars = subject.replace(/[^a-zA-Z]/g, "").length;
    if (totalChars > 0 && upperChars / totalChars > 0.40) {
      formattingWarnings.push("Exceso de mayúsculas en el asunto (>40%)");
      penalties += 20;
    }

    // 3. Check excessive exclamation marks
    if ((subject.match(/!/g) || []).length > 2) {
      formattingWarnings.push("Exceso de signos de exclamación en el asunto");
      penalties += 15;
    }

    const deliverabilityScore = Math.max(10, Math.min(100, 100 - penalties));
    const isSafeToSend = deliverabilityScore >= 75;

    // Estimate open rate based on deliverability score and subject length
    const isIdealLength = subject.length >= 30 && subject.length <= 60;
    let predictedOpenRate = Math.round((deliverabilityScore / 100) * (isIdealLength ? 42 : 32));
    if (predictedOpenRate > 50) predictedOpenRate = 48;

    // AI generated alternative recommendations
    const cleanBase = subject.replace(/[!$]/g, "").trim();
    const aiSubjectRecommendations = [
      `Cómo optimizar tus resultados: ${cleanBase}`,
      `Guía estratégica: ${cleanBase}`,
      `Novedades exclusivas para tu equipo`,
    ];

    return {
      deliverabilityScore,
      isSafeToSend,
      predictedOpenRate,
      triggeredSpamKeywords,
      formattingWarnings,
      aiSubjectRecommendations,
    };
  }
}

export const spamScoreShield = new SpamScoreShieldService();
