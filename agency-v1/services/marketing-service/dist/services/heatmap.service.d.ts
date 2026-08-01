export interface LinkClickHeatmapItem {
    url: string;
    clickCount: number;
    percentage: number;
    blockType?: string;
}
export declare class HeatmapService {
    /**
     * Generar métricas de mapa de calor agregadas para una campaña enviada
     */
    static getCampaignHeatmap(blastId: string): Promise<LinkClickHeatmapItem[]>;
}
