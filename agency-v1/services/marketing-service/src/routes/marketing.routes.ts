import { Router } from "express";
import { MarketingController } from "../controllers/marketing.controller";
import { WebhookController } from "../controllers/webhook.controller";
import { validateRequest } from "../middlewares/marketing.middleware";
import { z } from "zod";

const createEmailBlastSchema = z.object({
  name: z.string().min(1, "Blast name is required"),
  subject: z.string().min(1, "Subject is required"),
  htmlBody: z.string().min(1, "HTML body is required"),
  fromName: z.string().optional(),
  fromEmail: z.string().email("Invalid from email").optional()
});

export const marketingRouter = Router();

// Webhook & Tracking endpoints (sin autenticación estricta para proveedores / clientes)
marketingRouter.post("/email-blast/webhook", WebhookController.handleWebhook);
marketingRouter.get("/email-blast/track/open", WebhookController.trackOpen);
marketingRouter.get("/email-blast/track/click", WebhookController.trackClick);
marketingRouter.get("/email-blast/unsubscribe", WebhookController.unsubscribe);
marketingRouter.post("/email-blast/unsubscribe", WebhookController.unsubscribe);

// Diagnóstico DNS & Optimización IA
marketingRouter.get("/email-blast/dns-check", MarketingController.checkDns);
marketingRouter.post("/email-blast/spam-check", MarketingController.analyzeSpam);
marketingRouter.post("/email-blast/ai-generate", MarketingController.aiGenerateSubjects);

// Gestión de Lista de Supresión
marketingRouter.get("/email-blast/suppression-list", MarketingController.getSuppressionList);
marketingRouter.post("/email-blast/suppression-list", MarketingController.addToSuppression);
marketingRouter.delete("/email-blast/suppression-list", MarketingController.removeFromSuppression);

// Campañas de Email Masivo
marketingRouter.get("/email-blast", MarketingController.getEmailBlasts);
marketingRouter.post("/email-blast", validateRequest(createEmailBlastSchema), MarketingController.createEmailBlast);
marketingRouter.post("/email-blast/:id/send", MarketingController.sendEmailBlast);
