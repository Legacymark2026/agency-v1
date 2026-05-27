/**
 * SLA & Response Time Tracking (P0 #2)
 *
 * Manages SLA breaches, response times, and real-time alerts
 * - Tracks first response time
 * - Monitors resolution time
 * - Generates breach alerts at 60%, 80%, 100%
 * - Pauses/resumes SLA for external delays
 */
export interface SLAConfig {
    firstResponseMinutes: number;
    resolutionMinutes: number;
}
/**
 * Obtiene configuración de SLA para un company (default o custom)
 */
export declare function getSLAConfig(companyId: string): Promise<SLAConfig>;
/**
 * Crea o actualiza SLA para una conversación
 */
export declare function initializeSLA(conversationId: string, companyId: string): Promise<any>;
/**
 * Marca primera respuesta como enviada
 */
export declare function markFirstResponse(conversationId: string): Promise<void>;
/**
 * Marca conversación como resuelta
 */
export declare function markAsResolved(conversationId: string): Promise<void>;
/**
 * Pausa SLA (ej: esperando respuesta de cliente)
 */
export declare function pauseSLA(conversationId: string): Promise<void>;
/**
 * Reanuda SLA después de pausa
 */
export declare function resumeSLA(conversationId: string): Promise<void>;
/**
 * Obtiene warnings para mostrar en UI
 * Retorna % remaining y status de breach
 */
export declare function getSLAWarning(conversationId: string): Promise<{
    status: "OK" | "WARNING" | "CRITICAL" | "BREACHED";
    percentage: number;
} | null>;
/**
 * Obtiene todas las SLAs breached para dashboard
 */
export declare function getBreachedSLAs(companyId: string): Promise<any>;
