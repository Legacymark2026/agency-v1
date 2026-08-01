export interface EmailRecipient {
    email: string;
    name?: string;
    subject?: string;
    html?: string;
    variables?: Record<string, any>;
    headers?: Record<string, string>;
}
export interface SendBatchPayload {
    from: string;
    emails: Array<{
        to: string;
        subject: string;
        html: string;
        headers?: Record<string, string>;
    }>;
}
export interface EmailDeliveryItemResult {
    to: string;
    status: "SENT" | "FAILED";
    error?: string;
    id?: string;
}
export interface SendBatchResult {
    success: boolean;
    provider: string;
    sentCount: number;
    failedCount: number;
    errors?: string[];
    batchIds?: string[];
    results?: EmailDeliveryItemResult[];
}
export interface IEmailProvider {
    name: string;
    sendBatch(payload: SendBatchPayload): Promise<SendBatchResult>;
}
/**
 * Resend Batch Email Provider
 * Uses Resend API endpoint https://api.resend.com/emails/batch (up to 100 emails per batch)
 */
export declare class ResendBatchProvider implements IEmailProvider {
    name: string;
    private apiKey;
    constructor(apiKey?: string);
    sendBatch(payload: SendBatchPayload): Promise<SendBatchResult>;
}
/**
 * Real Nodemailer SMTP Provider
 */
export declare class SmtpProvider implements IEmailProvider {
    name: string;
    private config?;
    constructor(config?: {
        host?: string;
        port?: number;
        user?: string;
        pass?: string;
        secure?: boolean;
    });
    sendBatch(payload: SendBatchPayload): Promise<SendBatchResult>;
}
/**
 * Provider Manager with Auto-Failover & Per-Company Integration Lookup
 */
export declare class EmailProviderManager {
    getProviderForCompany(companyId?: string): Promise<IEmailProvider>;
    sendBatchWithFailover(payload: SendBatchPayload, companyId?: string): Promise<SendBatchResult>;
}
