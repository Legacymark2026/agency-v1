export interface SpamAnalysisResult {
    score: number;
    riskLevel: "LOW" | "MEDIUM" | "HIGH";
    findings: string[];
    recommendations: string[];
}
export interface AiSubjectGenerationInput {
    topic: string;
    tone?: string;
    audience?: string;
}
export declare class AiOptimizerService {
    private static SPAM_KEYWORDS;
    /**
     * Analizar puntaje de spam (Spam Score) de un correo
     */
    static analyzeSpamScore(subject: string, htmlBody: string): SpamAnalysisResult;
    /**
     * Generar sugerencias de líneas de asunto optimizadas con IA
     */
    static generateSubjectLines(input: AiSubjectGenerationInput): Promise<{
        subjects: string[];
    }>;
}
