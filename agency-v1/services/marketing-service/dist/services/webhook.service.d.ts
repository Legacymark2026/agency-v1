export interface WebhookEventPayload {
    type: string;
    data?: {
        email_id?: string;
        recipient?: string;
        email?: string;
        blast_id?: string;
        company_id?: string;
        created_at?: string;
        click_url?: string;
        bounce_type?: string;
        reason?: string;
    };
}
export declare class WebhookService {
    /**
     * Procesar webhook entrante de entregabilidad
     */
    static handleWebhookEvent(event: WebhookEventPayload): Promise<{
        success: boolean;
        message: string;
    }>;
}
