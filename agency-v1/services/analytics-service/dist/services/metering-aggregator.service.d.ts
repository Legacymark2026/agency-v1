export declare class MeteringAggregatorService {
    /**
     * Obtiene estadísticas agregadas de consumo de API por empresa
     */
    static getCompanyUsageStats(companyId: string, days?: number): Promise<{
        totalRequests: any;
        totalCostUsd: number;
        avgDurationMs: number;
        byService: Record<string, {
            requests: number;
            costUsd: number;
        }>;
        recentLogs: any;
    }>;
    /**
     * Obtiene datos de consumo por serie de tiempo (por hora/día) para gráficos de UI
     */
    static getCompanyUsageTimeSeries(companyId: string): Promise<{
        totalRequests: any;
        totalCostUsd: number;
        avgDurationMs: number;
        byService: Record<string, {
            requests: number;
            costUsd: number;
        }>;
        recentLogs: any;
    }>;
    /**
     * Inicia el Worker consumidor de Redis Streams para procesamiento en batch
     */
    static startStreamWorker(): void;
}
