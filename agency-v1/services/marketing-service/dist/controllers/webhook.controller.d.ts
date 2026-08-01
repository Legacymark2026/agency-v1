import { Request, Response, NextFunction } from "express";
export declare class WebhookController {
    /**
     * POST /api/v1/email-blast/webhook
     * Receiver universal para webhooks de entregabilidad (Resend/SendGrid/Postmark)
     */
    static handleWebhook(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * GET /api/v1/email-blast/track/open
     * Píxel transparente 1x1 para rastreo de apertura de correos
     */
    static trackOpen(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * GET /api/v1/email-blast/track/click
     * Redirección y rastreo de clics (CTR)
     */
    static trackClick(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * GET/POST /api/v1/email-blast/unsubscribe
     * Endpoint de desuscripción One-Click (RFC 8058)
     */
    static unsubscribe(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
}
