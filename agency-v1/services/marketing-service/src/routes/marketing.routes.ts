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

// Pruebas A/B & Mapa de Calor & Diagnóstico de Clientes & Zona Horaria & RSS
marketingRouter.post("/email-blast/ab-evaluate", MarketingController.evaluateAbTest);
marketingRouter.get("/email-blast/:id/heatmap", MarketingController.getHeatmap);
marketingRouter.post("/email-blast/client-matrix", MarketingController.checkClientMatrix);
marketingRouter.post("/email-blast/timezone-schedule", MarketingController.timezoneSchedule);
marketingRouter.post("/email-blast/rss-generate", MarketingController.rssGenerate);

// Diagnóstico DNS & Optimización IA & Compilador de Bloques & Previsualización
marketingRouter.get("/email-blast/dns-check", MarketingController.checkDns);
marketingRouter.post("/email-blast/spam-check", MarketingController.analyzeSpam);
marketingRouter.post("/email-blast/ai-generate", MarketingController.aiGenerateSubjects);
marketingRouter.post("/email-blast/compile", MarketingController.compileBlocks);
marketingRouter.post("/email-blast/compile-preview", MarketingController.compilePreview);
marketingRouter.get("/email-blast/components/presets", MarketingController.getPresets);

// Galería y Carga de Imágenes de Campañas
marketingRouter.get("/email-blast/images", MarketingController.getImages);
marketingRouter.post("/email-blast/images/upload", MarketingController.uploadImage);

// Gestión de Lista de Supresión
marketingRouter.get("/email-blast/suppression-list", MarketingController.getSuppressionList);
marketingRouter.post("/email-blast/suppression-list", MarketingController.addToSuppression);
marketingRouter.delete("/email-blast/suppression-list", MarketingController.removeFromSuppression);

// Campañas de Email Masivo
marketingRouter.get("/email-blast", MarketingController.getEmailBlasts);
marketingRouter.post("/email-blast", validateRequest(createEmailBlastSchema), MarketingController.createEmailBlast);
marketingRouter.post("/email-blast/:id/send", MarketingController.sendEmailBlast);
