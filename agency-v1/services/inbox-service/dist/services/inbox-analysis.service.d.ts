export declare class InboxAnalysisService {
    /**
     * Analiza el sentimiento de un texto de manera algorítmica/léxica (Fallback si no hay modelo IA disponible)
     */
    static analyzeSentiment(content: string): Promise<{
        sentiment: "POSITIVE" | "NEUTRAL" | "NEGATIVE" | "ANGRY";
        score: number;
    }>;
    /**
     * Genera una respuesta sugerida basada en los últimos mensajes de la conversación
     */
    static generateSuggestedReply(conversationId: string): Promise<string>;
}
