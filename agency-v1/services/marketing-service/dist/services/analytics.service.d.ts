export declare class AnalyticsService {
    /**
     * Obtener métricas detalladas de una campaña
     */
    static getCampaignAnalytics(blastId: string, companyId: string): Promise<{
        sent: any;
        delivered: number;
        opens: any;
        clicks: any;
        bounces: any;
        complaints: number;
        unsubscribes: number;
        openRate: number;
        clickRate: number;
        ctr: number;
        bounceRate: number;
        timeSeries: any[];
    }>;
    /**
     * Desglose por cliente de correo y dispositivo
     */
    static getAudienceBreakdown(blastId: string): Promise<{
        emailClients: {
            name: string;
            percentage: number;
        }[];
        devices: {
            name: string;
            percentage: number;
        }[];
    }>;
    /**
     * Distribución geográfica
     */
    static getGeographicDistribution(blastId: string): Promise<{
        country: string;
        city: string;
        count: number;
    }[]>;
    /**
     * Comparación de campañas
     */
    static getCampaignComparison(companyId: string, blastIds: string[]): Promise<any>;
    /**
     * Estadísticas globales del dashboard
     */
    static getGlobalDashboardStats(companyId: string): Promise<{
        totalSent: any;
        avgOpenRate: number;
        avgCtr: number;
        totalSubscribers: any;
        activeCampaigns: any;
        bestPerformingCampaign: any;
    }>;
}
