export interface CreateEmailBlastInput {
    companyId: string;
    name: string;
    subject: string;
    htmlBody: string;
    designJson?: any;
    isAbTest?: boolean;
    subjectB?: string;
    htmlBodyB?: string;
    fromName?: string;
    fromEmail?: string;
    status?: string;
    scheduledAt?: string | Date;
    totalRecipients?: number;
    createdById?: string;
    recipients?: Array<{
        email: string;
        name?: string;
        variables?: Record<string, any>;
    }>;
}
export declare class MarketingService {
    /**
     * Obtener envíos masivos por empresa
     */
    static getEmailBlasts(companyId: string): Promise<any>;
    /**
     * Crear campaña masiva filtrando automáticamente destinatarios suprimidos
     */
    static createEmailBlast(input: CreateEmailBlastInput): Promise<{
        blast: any;
        suppressedCount: number;
    }>;
    /**
     * Ejecutar envío de campaña por lotes (Batch Engine con Failover & Tracking)
     */
    static sendEmailBlast(blastId: string, companyId: string, baseUrl?: string): Promise<{
        success: boolean;
        sent: number;
        failed: number;
    }>;
    /**
     * Cron Worker para procesar automáticamente campañas programadas (status = 'SCHEDULED' o 'QUEUED')
     */
    static processScheduledBlasts(baseUrl?: string): Promise<void>;
    /**
     * Obtener un blast específico por ID
     */
    static getEmailBlast(blastId: string, companyId: string): Promise<any>;
    /**
     * Eliminar un blast por ID
     */
    static deleteEmailBlast(blastId: string, companyId: string): Promise<any>;
    /**
     * Eliminar múltiples blasts por IDs
     */
    static bulkDeleteEmailBlasts(blastIds: string[], companyId: string): Promise<any>;
    /**
     * Clonar un blast por ID
     */
    static cloneEmailBlast(blastId: string, companyId: string, createdById: string): Promise<any>;
}
