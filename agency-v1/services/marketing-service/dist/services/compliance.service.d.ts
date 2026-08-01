export declare class ComplianceService {
    /**
     * Registrar consentimiento explícito de un usuario para GDPR / CAN-SPAM
     */
    static recordConsent(email: string, companyId: string, source: string, ipAddress?: string): Promise<any>;
    /**
     * Obtener historial de consentimiento de un correo
     */
    static getConsentLog(email: string, companyId: string): Promise<any>;
    /**
     * Obtener preferencias del suscriptor
     */
    static getPreferenceCenter(email: string, companyId: string): Promise<any>;
    /**
     * Actualizar preferencias del suscriptor
     */
    static updatePreferences(email: string, companyId: string, preferences: {
        frequency?: string;
        categories?: string[];
    }): Promise<any>;
    /**
     * Identificar listas inactivas sin envíos recientes en N días
     */
    static getExpiredLists(companyId: string, daysInactive?: number): Promise<any>;
    /**
     * Exportar todos los datos asociados a un contacto (GDPR Right of Access)
     */
    static generateGdprReport(email: string, companyId: string): Promise<{
        email: string;
        companyId: string;
        exportedAt: string;
        consentLogs: any;
        campaignsReceived: any;
        preferences: any;
        error?: undefined;
    } | {
        email: string;
        companyId: string;
        exportedAt: string;
        error: any;
        consentLogs?: undefined;
        campaignsReceived?: undefined;
        preferences?: undefined;
    }>;
    /**
     * Elimina toda la información de rastreo de un contacto (Right to erasure)
     */
    static deleteContactData(email: string, companyId: string): Promise<{
        success: boolean;
        message: string;
    }>;
}
