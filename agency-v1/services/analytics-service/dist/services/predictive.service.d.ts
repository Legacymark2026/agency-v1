export declare class PredictiveService {
    /**
     * Predice las ventas de la próxima semana aplicando regresión lineal simple sobre las últimas 4 semanas
     */
    static predictNextWeekSales(companyId: string): Promise<{
        predictedSales: number;
        growthRate: number;
        historicalWeeksCount: number;
    }>;
    /**
     * Genera un reporte dinámico ejecutivo en formato HTML listo para imprimir/PDF
     */
    static generateReportHtml(companyId: string): Promise<string>;
}
