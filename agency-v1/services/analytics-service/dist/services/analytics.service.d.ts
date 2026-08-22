export interface TrackActivityInput {
    userId?: string;
    action: string;
    details?: any;
    ipAddress?: string;
    userAgent?: string;
}
export declare class AnalyticsService {
    /**
     * Obtener métricas y logs de uso por usuario
     */
    static getUserActivityLogs(userId: string, limit?: number): Promise<any>;
    /**
     * Registrar evento de actividad en la base de datos segregada analytics
     */
    static trackActivity(input: TrackActivityInput): Promise<any>;
}
