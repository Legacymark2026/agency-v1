export declare class TokenQuotaService {
    /**
     * Verifica si la empresa o el agente superaron su cuota diaria de tokens LLM
     */
    static checkQuota(companyId: string, agentId: string, requestedTokens?: number): Promise<{
        allowed: boolean;
        currentUsage: number;
        limit: number;
        message?: undefined;
    } | {
        allowed: boolean;
        currentUsage: number;
        limit: number;
        message: string;
    }>;
    /**
     * Registra el consumo de tokens tras la ejecución del modelo de IA
     */
    static recordTokenUsage(companyId: string, agentId: string, promptTokens: number, completionTokens: number): Promise<void>;
}
