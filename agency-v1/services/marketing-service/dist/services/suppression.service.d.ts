export declare class SuppressionService {
    /**
     * Obtener lista de emails suprimidos para una empresa
     */
    static getSuppressionList(companyId: string): Promise<any>;
    /**
     * Filtrar destinatarios removiendo los que están en la lista de supresión
     */
    static filterSuppressedRecipients<T extends {
        email: string;
    }>(companyId: string, recipients: T[]): Promise<{
        valid: T[];
        suppressedCount: number;
    }>;
    /**
     * Agregar un email a la lista de supresión de la empresa
     */
    static addToSuppression(companyId: string, email: string, reason: string): Promise<any>;
    /**
     * Eliminar un email de la lista de supresión
     */
    static removeFromSuppression(companyId: string, email: string): Promise<any>;
}
