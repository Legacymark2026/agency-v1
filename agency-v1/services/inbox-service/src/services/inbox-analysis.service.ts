import { prisma } from "@agency/database";

export class InboxAnalysisService {
  /**
   * Analiza el sentimiento de un texto de manera algorítmica/léxica (Fallback si no hay modelo IA disponible)
   */
  static async analyzeSentiment(content: string): Promise<{ sentiment: "POSITIVE" | "NEUTRAL" | "NEGATIVE" | "ANGRY"; score: number }> {
    const text = content.toLowerCase();

    // Palabras clave cargadas de sentimiento
    const positiveWords = ["gracias", "excelente", "bueno", "feliz", "amar", "recomiendo", "rápido", "perfecto", "genial", "increíble"];
    const negativeWords = ["malo", "lento", "retraso", "problema", "fallo", "error", "decepcionado", "peor", "inútil", "queja"];
    const angryWords = ["estafa", "robo", "peor servicio", "odio", "demanda", "devolución", "legal", "abuso", "inaceptable"];

    let positiveCount = 0;
    let negativeCount = 0;
    let angryCount = 0;

    positiveWords.forEach(w => { if (text.includes(w)) positiveCount++; });
    negativeWords.forEach(w => { if (text.includes(w)) negativeCount++; });
    angryWords.forEach(w => { if (text.includes(w)) angryCount++; });

    if (angryCount > 0) {
      return { sentiment: "ANGRY", score: -0.8 - (angryCount * 0.05) };
    }
    if (negativeCount > positiveCount) {
      return { sentiment: "NEGATIVE", score: -0.1 - (negativeCount * 0.1) };
    }
    if (positiveCount > negativeCount) {
      return { sentiment: "POSITIVE", score: 0.2 + (positiveCount * 0.1) };
    }
    return { sentiment: "NEUTRAL", score: 0.0 };
  }

  /**
   * Genera una respuesta sugerida basada en los últimos mensajes de la conversación
   */
  static async generateSuggestedReply(conversationId: string): Promise<string> {
    console.log(`[InboxAnalysisService] Generating suggested reply for conversation: ${conversationId}`);
    
    let lastMessages: any[] = [];
    try {
      lastMessages = await prisma.message.findMany({
        where: { conversationId },
        orderBy: { createdAt: "desc" },
        take: 3
      });
    } catch {
      // Fallback stub if database query fails
    }

    if (lastMessages.length === 0) {
      return "Hola, ¿en qué podemos ayudarte hoy con nuestros servicios?";
    }

    const lastMsgContent = lastMessages[0].content.toLowerCase();
    
    // Reglas heurísticas de respuesta basadas en intención
    if (lastMsgContent.includes("precio") || lastMsgContent.includes("costo") || lastMsgContent.includes("cotización")) {
      return "Hola. Con mucho gusto te compartimos nuestro portafolio de precios. Contamos con planes desde $29 USD mensuales. ¿Te gustaría agendar una llamada breve de 5 minutos?";
    }
    if (lastMsgContent.includes("soporte") || lastMsgContent.includes("problema") || lastMsgContent.includes("error")) {
      return "Lamentamos las molestias presentadas. He escalado este inconveniente con nuestro equipo técnico de soporte. Nos pondremos en contacto contigo en breve para solucionarlo.";
    }
    if (lastMsgContent.includes("horario") || lastMsgContent.includes("abierto") || lastMsgContent.includes("dirección")) {
      return "Hola. Nuestro horario de atención boutique es de lunes a viernes de 8:00 AM a 6:00 PM y sábados de 9:00 AM a 1:00 PM. Estamos ubicados en la sede principal.";
    }

    return "Gracias por ponerte en contacto con nosotros. Tu solicitud está siendo revisada por un asesor y te responderemos a la mayor brevedad posible.";
  }
}
