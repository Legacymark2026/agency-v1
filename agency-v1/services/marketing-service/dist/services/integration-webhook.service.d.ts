export declare class IntegrationWebhookService {
    /**
     * Registrar un endpoint de webhook para eventos
     */
    static registerWebhook(companyId: string, url: string, events: string[], secret?: string): Promise<{
        id: string;
        companyId: string;
        url: string;
        events: string[];
        secret: string;
        createdAt: Date;
    }>;
    /**
     * Listar webhooks registrados
     */
    static getWebhooks(companyId: string): Promise<never[]>;
    /**
     * Eliminar un webhook
     */
    static deleteWebhook(webhookId: string): Promise<{
        success: boolean;
        id: string;
    }>;
    /**
     * Enviar evento a todos los webhooks registrados que coincidan
     */
    static dispatchEvent(companyId: string, event: string, payload: any): Promise<void>;
    /**
     * Enviar evento ping de prueba para verificar URL
     */
    static testWebhook(webhookId: string): Promise<{
        success: boolean;
        status: number;
        error?: undefined;
    } | {
        success: boolean;
        error: any;
        status?: undefined;
    }>;
}
