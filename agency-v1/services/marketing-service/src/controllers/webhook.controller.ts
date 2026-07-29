import { Request, Response, NextFunction } from "express";
import { WebhookService } from "../services/webhook.service";
import { TrackingService } from "../services/tracking.service";
import { SuppressionService } from "../services/suppression.service";
import { prisma } from "@agency/database";

export class WebhookController {
  /**
   * POST /api/v1/email-blast/webhook
   * Receiver universal para webhooks de entregabilidad (Resend/SendGrid/Postmark)
   */
  static async handleWebhook(req: Request, res: Response, next: NextFunction) {
    try {
      const payload = req.body;
      const result = await WebhookService.handleWebhookEvent(payload);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/email-blast/track/open
   * Píxel transparente 1x1 para rastreo de apertura de correos
   */
  static async trackOpen(req: Request, res: Response, next: NextFunction) {
    try {
      const token = req.query.token as string;
      if (token) {
        try {
          const payload = TrackingService.verifyToken(token);
          await WebhookService.handleWebhookEvent({
            type: "email.opened",
            data: {
              recipient: payload.email,
              blast_id: payload.blastId,
              company_id: payload.companyId
            }
          });
        } catch {}
      }

      // Devolver GIF transparente 1x1 pixel
      const transparentPixel = Buffer.from(
        "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
        "base64"
      );

      res.writeHead(200, {
        "Content-Type": "image/gif",
        "Content-Length": transparentPixel.length,
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        Pragma: "no-cache",
        Expires: "0"
      });
      res.end(transparentPixel);
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/email-blast/track/click
   * Redirección y rastreo de clics (CTR)
   */
  static async trackClick(req: Request, res: Response, next: NextFunction) {
    try {
      const token = req.query.token as string;
      const targetUrl = (req.query.target as string) || "https://legacymarksas.com";

      if (token) {
        try {
          const payload = TrackingService.verifyToken(token);
          await WebhookService.handleWebhookEvent({
            type: "email.clicked",
            data: {
              recipient: payload.email,
              blast_id: payload.blastId,
              company_id: payload.companyId,
              click_url: targetUrl
            }
          });
        } catch {}
      }

      res.redirect(targetUrl);
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET/POST /api/v1/email-blast/unsubscribe
   * Endpoint de desuscripción One-Click (RFC 8058)
   */
  static async unsubscribe(req: Request, res: Response, next: NextFunction) {
    try {
      const token = (req.query.token || req.body.token) as string;
      if (!token) {
        return res.status(400).json({ error: "Token de desuscripción requerido" });
      }

      const payload = TrackingService.verifyToken(token);
      await SuppressionService.addToSuppression(payload.companyId, payload.email, "Unsubscribed via RFC 8058 One-Click");

      // Actualizar estado del receptor
      await (prisma as any).emailBlastRecipient.updateMany({
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
    } catch (err) {
      res.status(400).send("Token de desuscripción inválido o expirado");
    }
  }
}
