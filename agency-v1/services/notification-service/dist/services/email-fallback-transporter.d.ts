/**
 * Email Multi-Transporter Fallback Manager
 * ─────────────────────────────────────────────────────────────────────────────
 * Multi-tier email dispatcher supporting Resend API, Nodemailer SMTP,
 * and persistent Outbox Event database backup.
 */
export interface SendEmailPayload {
    to: string;
    subject: string;
    html: string;
    text?: string;
    companyId?: string;
    metadata?: Record<string, any>;
}
export interface EmailDispatchResult {
    success: boolean;
    provider: string;
    messageId?: string;
    attempts: number;
    fallbackTriggered: boolean;
    error?: string;
}
export declare function sendResilientEmail(payload: SendEmailPayload): Promise<EmailDispatchResult>;
//# sourceMappingURL=email-fallback-transporter.d.ts.map