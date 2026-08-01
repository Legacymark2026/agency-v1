export interface Rule {
    field: string;
    operator: 'isNotNull' | 'isNull' | 'gt' | 'lt' | 'eq';
    value?: string;
}
export interface SegmentDefinition {
    logic: 'AND' | 'OR';
    conditions: Rule[];
}
export declare class SegmentBuilderService {
    /**
     * Crear una definición dinámica de segmento
     */
    static createSegment(companyId: string, name: string, rules: SegmentDefinition[]): Promise<{
        id: string;
        companyId: string;
        name: string;
        rules: SegmentDefinition[];
    }>;
    /**
     * Listar todos los segmentos
     */
    static getSegments(companyId: string): Promise<never[]>;
    /**
     * Aplicar reglas contra la tabla emailBlastRecipient y retornar contactos coincidentes con conteo
     */
    static evaluateSegment(segmentId: string): Promise<{
        segmentId: string;
        matchCount: number;
        estimatedTime: string;
    }>;
    /**
     * Lista paginada de contactos que coinciden con el segmento
     */
    static getSegmentContacts(segmentId: string, page: number, limit: number): Promise<{
        data: {
            email: string;
            name: string;
        }[];
        total: number;
        page: number;
        limit: number;
    }>;
    /**
     * Segmentos rápidos basados en actividad
     */
    static getActivityBasedSegment(companyId: string, criteria: 'opened_last_campaign' | 'never_opened' | 'clicked_last_30_days' | 'inactive_60_days'): Promise<{
        id: string;
        companyId: string;
        name: string;
        rules: SegmentDefinition[];
    }>;
}
