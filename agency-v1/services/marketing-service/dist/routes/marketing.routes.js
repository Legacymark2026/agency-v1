"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.marketingRouter = void 0;
const express_1 = require("express");
const marketing_controller_1 = require("../controllers/marketing.controller");
const webhook_controller_1 = require("../controllers/webhook.controller");
const marketing_middleware_1 = require("../middlewares/marketing.middleware");
const zod_1 = require("zod");
const createEmailBlastSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, "Blast name is required"),
    subject: zod_1.z.string().min(1, "Subject is required"),
    htmlBody: zod_1.z.string().min(1, "HTML body is required"),
    fromName: zod_1.z.string().optional(),
    fromEmail: zod_1.z.string().email("Invalid from email").optional()
});
exports.marketingRouter = (0, express_1.Router)();
// Webhook & Tracking endpoints (sin autenticación estricta para proveedores / clientes)
exports.marketingRouter.post("/email-blast/webhook", webhook_controller_1.WebhookController.handleWebhook);
exports.marketingRouter.get("/email-blast/track/open", webhook_controller_1.WebhookController.trackOpen);
exports.marketingRouter.get("/email-blast/track/click", webhook_controller_1.WebhookController.trackClick);
exports.marketingRouter.get("/email-blast/unsubscribe", webhook_controller_1.WebhookController.unsubscribe);
exports.marketingRouter.post("/email-blast/unsubscribe", webhook_controller_1.WebhookController.unsubscribe);
// Pruebas A/B & Mapa de Calor & Diagnóstico de Clientes & Zona Horaria & RSS
exports.marketingRouter.post("/email-blast/ab-evaluate", marketing_controller_1.MarketingController.evaluateAbTest);
exports.marketingRouter.get("/email-blast/:id/heatmap", marketing_controller_1.MarketingController.getHeatmap);
exports.marketingRouter.post("/email-blast/client-matrix", marketing_controller_1.MarketingController.checkClientMatrix);
exports.marketingRouter.post("/email-blast/timezone-schedule", marketing_controller_1.MarketingController.timezoneSchedule);
exports.marketingRouter.post("/email-blast/rss-generate", marketing_controller_1.MarketingController.rssGenerate);
// Diagnóstico DNS & Optimización IA & Compilador de Bloques & Previsualización
exports.marketingRouter.get("/email-blast/dns-check", marketing_controller_1.MarketingController.checkDns);
exports.marketingRouter.post("/email-blast/spam-check", marketing_controller_1.MarketingController.analyzeSpam);
exports.marketingRouter.post("/email-blast/ai-generate", marketing_controller_1.MarketingController.aiGenerateSubjects);
exports.marketingRouter.post("/email-blast/compile", marketing_controller_1.MarketingController.compileBlocks);
exports.marketingRouter.post("/email-blast/compile-preview", marketing_controller_1.MarketingController.compilePreview);
exports.marketingRouter.get("/email-blast/components/presets", marketing_controller_1.MarketingController.getPresets);
// Galería y Carga de Imágenes de Campañas
exports.marketingRouter.get("/email-blast/images", marketing_controller_1.MarketingController.getImages);
exports.marketingRouter.post("/email-blast/images/upload", marketing_controller_1.MarketingController.uploadImage);
// Gestión de Lista de Supresión
exports.marketingRouter.get("/email-blast/suppression-list", marketing_controller_1.MarketingController.getSuppressionList);
exports.marketingRouter.post("/email-blast/suppression-list", marketing_controller_1.MarketingController.addToSuppression);
exports.marketingRouter.delete("/email-blast/suppression-list", marketing_controller_1.MarketingController.removeFromSuppression);
// Campañas de Email Masivo
exports.marketingRouter.get("/email-blast", marketing_controller_1.MarketingController.getEmailBlasts);
exports.marketingRouter.post("/email-blast", (0, marketing_middleware_1.validateRequest)(createEmailBlastSchema), marketing_controller_1.MarketingController.createEmailBlast);
exports.marketingRouter.post("/email-blast/bulk-delete", marketing_controller_1.MarketingController.bulkDeleteEmailBlasts);
exports.marketingRouter.get("/email-blast/:id", marketing_controller_1.MarketingController.getEmailBlast);
exports.marketingRouter.delete("/email-blast/:id", marketing_controller_1.MarketingController.deleteEmailBlast);
exports.marketingRouter.post("/email-blast/:id/send", marketing_controller_1.MarketingController.sendEmailBlast);
exports.marketingRouter.post("/email-blast/:id/clone", marketing_controller_1.MarketingController.cloneEmailBlast);
//# sourceMappingURL=marketing.routes.js.map