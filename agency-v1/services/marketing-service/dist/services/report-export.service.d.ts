export declare class ReportExportService {
    /**
     * Generar reporte HTML hermoso con estadísticas de campaña
     */
    static generateCampaignReportHtml(blastId: string): Promise<string>;
    /**
     * Exportar datos a nivel de destinatario como CSV
     */
    static generateCampaignCsv(blastId: string): Promise<string>;
    /**
     * Generar resumen ejecutivo a través de todas las campañas
     */
    static generateExecutiveSummary(companyId: string, dateRange?: {
        start: Date;
        end: Date;
    }): Promise<{
        companyId: string;
        totalSent: number;
        averageOpenRate: number;
        averageClickRate: number;
        topCampaigns: {
            id: string;
            name: string;
            openRate: number;
        }[];
        recommendations: string[];
    }>;
    /**
     * Retornar lista cronológica de eventos para un contacto
     */
    static getContactTimeline(email: string, companyId: string): Promise<{
        type: string;
        timestamp: Date;
        campaignId: string;
    }[]>;
}
