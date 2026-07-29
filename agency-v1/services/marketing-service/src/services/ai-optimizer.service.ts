export interface SpamAnalysisResult {
  score: number; // 0 = low risk, 100 = high spam risk
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
  findings: string[];
  recommendations: string[];
}

export interface AiSubjectGenerationInput {
  topic: string;
  tone?: string;
  audience?: string;
}

export class AiOptimizerService {
  private static SPAM_KEYWORDS = [
    "100% gratis", "gratis", "ganador", "dinero rápido", "haz clic aquí",
    "sin costo", "garantizado", "oferta exclusiva", "ingresos extra",
    "urgente", "actúa ahora", "compra ya", "no es spam", "premio", "felicitaciones"
  ];

  /**
   * Analizar puntaje de spam (Spam Score) de un correo
   */
  static analyzeSpamScore(subject: string, htmlBody: string): SpamAnalysisResult {
    const findings: string[] = [];
    const recommendations: string[] = [];
    let score = 0;

    // 1. Subject checks
    if (!subject || subject.length < 5) {
      score += 25;
      findings.push("El asunto es demasiado corto o está vacío.");
      recommendations.push("Utiliza un asunto descriptivo de entre 30 y 60 caracteres.");
    }

    if (subject.toUpperCase() === subject && subject.length > 5) {
      score += 30;
      findings.push("El asunto está completamente en mayúsculas.");
      recommendations.push("Evita usar mayúsculas sostenidas en la línea de asunto.");
    }

    if ((subject.match(/!/g) || []).length > 1) {
      score += 15;
      findings.push("Uso excesivo de signos de exclamación en el asunto.");
      recommendations.push("Limita el uso de exclamaciones en el asunto.");
    }

    // 2. Keyword detection
    const combinedText = `${subject} ${htmlBody}`.toLowerCase();
    const detectedKeywords: string[] = [];
    for (const kw of this.SPAM_KEYWORDS) {
      if (combinedText.includes(kw)) {
        score += 12;
        detectedKeywords.push(kw);
      }
    }

    if (detectedKeywords.length > 0) {
      findings.push(`Palabras clave asociadas a filtros de spam detectadas: ${detectedKeywords.join(", ")}.`);
      recommendations.push("Sustituye términos comerciales agresivos por un lenguaje conversacional.");
    }

    // 3. Body text ratio
    const plainText = htmlBody.replace(/<[^>]+>/g, " ").trim();
    if (plainText.length < 50) {
      score += 20;
      findings.push("El cuerpo del mensaje contiene muy poco texto plano.");
      recommendations.push("Incluye contenido textual informativo y evita correos basados únicamente en imágenes.");
    }

    // Cap score between 0 and 100
    score = Math.min(Math.max(score, 0), 100);
    const riskLevel: "LOW" | "MEDIUM" | "HIGH" = score > 60 ? "HIGH" : score > 30 ? "MEDIUM" : "LOW";

    return {
      score,
      riskLevel,
      findings,
      recommendations
    };
  }

  /**
   * Generar sugerencias de líneas de asunto optimizadas con IA
   */
  static async generateSubjectLines(input: AiSubjectGenerationInput): Promise<{ subjects: string[] }> {
    const tone = input.tone || "profesional y persuasivo";
    const topic = input.topic;

    try {
      const response = await fetch("http://ai-engine:3000/api/v1/agents/run", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-company-id": "system" },
        body: JSON.stringify({
          agentId: "marketing-ai",
          userMessage: `Genera 5 líneas de asunto atractivas para un correo sobre: "${topic}" con tono ${tone}. Devuelve solo la lista.`
        })
      });

      if (response.ok) {
        const data = (await response.json()) as any;
        if (data.response) {
          const lines = String(data.response)
            .split("\n")
            .map((l) => l.replace(/^\d+[\.\)]\s*/, "").trim())
            .filter((l) => l.length > 5);
          if (lines.length > 0) return { subjects: lines.slice(0, 5) };
        }
      }
    } catch {}

    // Fallback AI generated template suggestions
    return {
      subjects: [
        `💡 Exclusivo para ti: Descubre ${topic}`,
        `🚀 Novedades importantes sobre ${topic}`,
        `¿Listo para llevar tu estrategia al siguiente nivel? ${topic}`,
        `Guía práctica: Todo lo que necesitas saber sobre ${topic}`,
        `Resumen estratégico: ${topic}`
      ]
    };
  }
}
