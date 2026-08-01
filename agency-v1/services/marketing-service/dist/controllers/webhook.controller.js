"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebhookController = void 0;
const webhook_service_1 = require("../services/webhook.service");
const tracking_service_1 = require("../services/tracking.service");
const suppression_service_1 = require("../services/suppression.service");
const database_1 = require("@agency/database");
class WebhookController {
    /**
     * POST /api/v1/email-blast/webhook
     * Receiver universal para webhooks de entregabilidad (Resend/SendGrid/Postmark)
     */
    static async handleWebhook(req, res, next) {
        try {
            const payload = req.body;
            const result = await webhook_service_1.WebhookService.handleWebhookEvent(payload);
            res.json(result);
        }
        catch (err) {
            next(err);
        }
    }
    /**
     * GET /api/v1/email-blast/track/open
     * Píxel transparente 1x1 para rastreo de apertura de correos
     */
    static async trackOpen(req, res, next) {
        try {
            const token = req.query.token;
            if (token) {
                try {
                    const payload = tracking_service_1.TrackingService.verifyToken(token);
                    await webhook_service_1.WebhookService.handleWebhookEvent({
                        type: "email.opened",
                        data: {
                            recipient: payload.email,
                            blast_id: payload.blastId,
                            company_id: payload.companyId
                        }
                    });
                }
                catch { }
            }
            // Devolver GIF transparente 1x1 pixel
            const transparentPixel = Buffer.from("R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7", "base64");
            res.writeHead(200, {
                "Content-Type": "image/gif",
                "Content-Length": transparentPixel.length,
                "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
                Pragma: "no-cache",
                Expires: "0"
            });
            res.end(transparentPixel);
        }
        catch (err) {
            next(err);
        }
    }
    /**
     * GET /api/v1/email-blast/track/click
     * Redirección y rastreo de clics (CTR)
     */
    static async trackClick(req, res, next) {
        try {
            const token = req.query.token;
            const targetUrl = req.query.target || "https://legacymarksas.com";
            if (token) {
                try {
                    const payload = tracking_service_1.TrackingService.verifyToken(token);
                    await webhook_service_1.WebhookService.handleWebhookEvent({
                        type: "email.clicked",
                        data: {
                            recipient: payload.email,
                            blast_id: payload.blastId,
                            company_id: payload.companyId,
                            click_url: targetUrl
                        }
                    });
                }
                catch { }
            }
            res.redirect(targetUrl);
        }
        catch (err) {
            next(err);
        }
    }
    /**
     * GET/POST /api/v1/email-blast/unsubscribe
     * Endpoint de desuscripción One-Click (RFC 8058)
     */
    static async unsubscribe(req, res, next) {
        try {
            const token = (req.query.token || req.body.token);
            if (!token) {
                return res.status(400).json({ error: "Token de desuscripción requerido" });
            }
            const payload = tracking_service_1.TrackingService.verifyToken(token);
            await suppression_service_1.SuppressionService.addToSuppression(payload.companyId, payload.email, "Unsubscribed via RFC 8058 One-Click");
            // Actualizar estado del receptor
            await database_1.prisma.emailBlastRecipient.updateMany({
                where: { email: payload.email.toLowerCase().trim() },
                data: { status: "UNSUBSCRIBED" }
            });
            res.send(`
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <title>Desuscripción Confirmada</title>
            <style>
              body { font-family: system-ui, sans-serif; text-align: center; padding: 50px; background: #0f172a; color: #f8fafc; }
              .card { background: #1e293b; padding: 40px; border-radius: 12px; max-width: 500px; margin: 0 auto; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }
              h1 { color: #38bdf8; }
            </style>
          </head>
          <body>
            <div class="card">
              <h1>Desuscripción Exitosa</h1>
              <p>El correo <strong>${payload.email}</strong> ha sido removido exitosamente de la lista de envíos.</p>
              <p style="color: #94a3b8; font-size: 14px;">Ya no recibirás correos de esta campaña.</p>
            </div>
          </body>
        </html>
      `);
        }
        catch (err) {
            res.status(400).send("Token de desuscripción inválido o expirado");
        }
    }
}
exports.WebhookController = WebhookController;
//# sourceMappingURL=webhook.controller.js.map