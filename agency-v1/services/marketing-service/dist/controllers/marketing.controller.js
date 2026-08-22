"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MarketingController = void 0;
const database_1 = require("@agency/database");
const marketing_service_1 = require("../services/marketing.service");
const dns_validator_1 = require("../services/dns-validator");
const ai_optimizer_service_1 = require("../services/ai-optimizer.service");
const suppression_service_1 = require("../services/suppression.service");
const block_compiler_service_1 = require("../services/block-compiler.service");
const image_manager_service_1 = require("../services/image-manager.service");
const ab_testing_service_1 = require("../services/ab-testing.service");
const heatmap_service_1 = require("../services/heatmap.service");
const client_preview_service_1 = require("../services/client-preview.service");
const timezone_delivery_service_1 = require("../services/timezone-delivery.service");
const rss_automation_service_1 = require("../services/rss-automation.service");
async function resolveCompanyId(req) {
    const explicitId = String(req.headers["x-company-id"] || req.query.companyId || req.body?.companyId || "").trim();
    if (explicitId)
        return explicitId;
    try {
        const firstCompany = await database_1.prisma.company.findFirst({ select: { id: true } });
        if (firstCompany?.id)
            return firstCompany.id;
    }
    catch (e) {
        console.warn("[resolveCompanyId] Database lookup warning:", e);
    }
    return "";
}
class MarketingController {
    /**
     * GET /api/v1/email-blast
     */
    static async getEmailBlasts(req, res, next) {
        try {
            const companyId = await resolveCompanyId(req);
            if (!companyId) {
                return res.status(400).json({ success: false, error: "companyId is required" });
            }
            const blasts = await marketing_service_1.MarketingService.getEmailBlasts(companyId);
            res.json(blasts);
        }
        catch (err) {
            next(err);
        }
    }
    /**
     * POST /api/v1/email-blast
     */
    static async createEmailBlast(req, res, next) {
        try {
            const companyId = await resolveCompanyId(req);
            if (!companyId) {
                return res.status(400).json({ success: false, error: "companyId is required" });
            }
            const result = await marketing_service_1.MarketingService.createEmailBlast({
                ...req.body,
                companyId
            });
            res.status(201).json({ success: true, ...result });
        }
        catch (err) {
            next(err);
        }
    }
    /**
     * GET /api/v1/email-blast/:id
     */
    static async getEmailBlast(req, res, next) {
        try {
            const blastId = String(req.params.id);
            const companyId = await resolveCompanyId(req);
            if (!companyId) {
                return res.status(400).json({ success: false, error: "companyId is required" });
            }
            const blast = await marketing_service_1.MarketingService.getEmailBlast(blastId, companyId);
            if (!blast)
                return res.status(404).json({ success: false, error: "Campaña no encontrada" });
            res.json(blast);
        }
        catch (err) {
            next(err);
        }
    }
    /**
     * DELETE /api/v1/email-blast/:id
     */
    static async deleteEmailBlast(req, res, next) {
        try {
            const blastId = String(req.params.id);
            const companyId = await resolveCompanyId(req);
            if (!companyId) {
                return res.status(400).json({ success: false, error: "companyId is required" });
            }
            await marketing_service_1.MarketingService.deleteEmailBlast(blastId, companyId);
            res.json({ success: true, message: "Campaña eliminada exitosamente" });
        }
        catch (err) {
            next(err);
        }
    }
    /**
     * POST /api/v1/email-blast/bulk-delete
     */
    static async bulkDeleteEmailBlasts(req, res, next) {
        try {
            const { blastIds } = req.body;
            const companyId = await resolveCompanyId(req);
            if (!companyId || !Array.isArray(blastIds)) {
                return res.status(400).json({ success: false, error: "companyId and blastIds array are required" });
            }
            await marketing_service_1.MarketingService.bulkDeleteEmailBlasts(blastIds, companyId);
            res.json({ success: true, message: "Campañas eliminadas exitosamente" });
        }
        catch (err) {
            next(err);
        }
    }
    /**
     * POST /api/v1/email-blast/:id/clone
     */
    static async cloneEmailBlast(req, res, next) {
        try {
            const blastId = String(req.params.id);
            const companyId = await resolveCompanyId(req);
            const createdById = String(req.body.userId || "system");
            if (!companyId) {
                return res.status(400).json({ success: false, error: "companyId is required" });
            }
            const cloned = await marketing_service_1.MarketingService.cloneEmailBlast(blastId, companyId, createdById);
            res.status(201).json({ success: true, cloned });
        }
        catch (err) {
            next(err);
        }
    }
    /**
     * POST /api/v1/email-blast/:id/send
     */
    static async sendEmailBlast(req, res, next) {
        try {
            const blastId = String(req.params.id);
            const companyId = await resolveCompanyId(req);
            if (!companyId) {
                return res.status(400).json({ success: false, error: "companyId is required" });
            }
            // Resolver la URL pública real del servidor para píxeles de rastreo y desuscripción
            const proto = req.headers["x-forwarded-proto"] || req.protocol || "https";
            const host = req.headers["x-forwarded-host"] || req.get("host") || "app.legacymarksas.com";
            const baseUrl = process.env.PUBLIC_APP_URL || process.env.NEXT_PUBLIC_APP_URL || `${proto}://${host}`;
            // Iniciar el proceso de envío en segundo plano para evitar bloqueos por timeout
            marketing_service_1.MarketingService.sendEmailBlast(blastId, companyId, baseUrl).catch((err) => {
                console.error(`[sendEmailBlast Background Error] Blast ID ${blastId}:`, err);
            });
            res.json({
                success: true,
                message: "Proceso de envío de campaña iniciado en segundo plano",
                blastId
            });
        }
        catch (err) {
            next(err);
        }
    }
    /**
     * GET /api/v1/email-blast/dns-check
     */
    static async checkDns(req, res, next) {
        try {
            const targetDomain = typeof req.query.domain === "string"
                ? req.query.domain
                : (typeof req.body?.domain === "string" ? req.body.domain : "legacymarksas.com");
            const result = await dns_validator_1.DnsValidatorService.checkDomain(targetDomain);
            res.json({ success: true, result });
        }
        catch (err) {
            next(err);
        }
    }
    /**
     * POST /api/v1/email-blast/spam-check
     */
    static async analyzeSpam(req, res, next) {
        try {
            const { subject, htmlBody } = req.body;
            const result = ai_optimizer_service_1.AiOptimizerService.analyzeSpamScore(subject || "", htmlBody || "");
            res.json({ success: true, result });
        }
        catch (err) {
            next(err);
        }
    }
    /**
     * POST /api/v1/email-blast/ai-generate
     */
    static async aiGenerateSubjects(req, res, next) {
        try {
            const { topic, tone, audience } = req.body;
            if (!topic) {
                return res.status(400).json({ success: false, error: "topic is required" });
            }
            const result = await ai_optimizer_service_1.AiOptimizerService.generateSubjectLines({ topic, tone, audience });
            res.json({ success: true, ...result });
        }
        catch (err) {
            next(err);
        }
    }
    /**
     * GET /api/v1/email-blast/suppression-list
     */
    static async getSuppressionList(req, res, next) {
        try {
            const companyId = await resolveCompanyId(req);
            if (!companyId) {
                return res.status(400).json({ success: false, error: "companyId is required" });
            }
            const list = await suppression_service_1.SuppressionService.getSuppressionList(companyId);
            res.json({ success: true, list });
        }
        catch (err) {
            next(err);
        }
    }
    /**
     * POST /api/v1/email-blast/suppression-list
     */
    static async addToSuppression(req, res, next) {
        try {
            const companyId = String(req.headers["x-company-id"] || req.body.companyId || "");
            const { email, reason } = req.body;
            if (!companyId || !email) {
                return res.status(400).json({ success: false, error: "companyId and email are required" });
            }
            const entry = await suppression_service_1.SuppressionService.addToSuppression(companyId, email, reason || "Manual Addition");
            res.status(201).json({ success: true, entry });
        }
        catch (err) {
            next(err);
        }
    }
    /**
     * DELETE /api/v1/email-blast/suppression-list
     */
    static async removeFromSuppression(req, res, next) {
        try {
            const companyId = String(req.headers["x-company-id"] || req.query.companyId || req.body.companyId || "");
            const email = String(req.query.email || req.body.email || "");
            if (!companyId || !email) {
                return res.status(400).json({ success: false, error: "companyId and email are required" });
            }
            await suppression_service_1.SuppressionService.removeFromSuppression(companyId, email);
            res.json({ success: true });
        }
        catch (err) {
            next(err);
        }
    }
    /**
     * POST /api/v1/email-blast/timezone-schedule
     */
    static async timezoneSchedule(req, res, next) {
        try {
            const { recipients, targetHour } = req.body;
            if (!recipients || !Array.isArray(recipients)) {
                return res.status(400).json({ success: false, error: "recipients array is required" });
            }
            const groups = timezone_delivery_service_1.TimezoneDeliveryService.groupRecipientsByTimezone(recipients, targetHour || 9);
            res.json({ success: true, groups });
        }
        catch (err) {
            next(err);
        }
    }
    /**
     * POST /api/v1/email-blast/rss-generate
     */
    static async rssGenerate(req, res, next) {
        try {
            const { companyName, articles } = req.body;
            if (!articles || !Array.isArray(articles)) {
                return res.status(400).json({ success: false, error: "articles array is required" });
            }
            const result = rss_automation_service_1.RssAutomationService.generateNewsletterFromArticles(companyName || "LegacyMark", articles);
            res.json({ success: true, ...result });
        }
        catch (err) {
            next(err);
        }
    }
    /**
     * POST /api/v1/email-blast/ab-evaluate
     */
    static async evaluateAbTest(req, res, next) {
        try {
            const { blastId, metricGoal } = req.body;
            if (!blastId)
                return res.status(400).json({ success: false, error: "blastId is required" });
            const metrics = await ab_testing_service_1.AbTestingService.evaluateAbWinner(blastId, metricGoal || "OPENS");
            res.json({ success: true, metrics });
        }
        catch (err) {
            next(err);
        }
    }
    /**
     * GET /api/v1/email-blast/:id/heatmap
     */
    static async getHeatmap(req, res, next) {
        try {
            const blastId = String(req.params.id || "");
            if (!blastId)
                return res.status(400).json({ success: false, error: "blastId is required" });
            const heatmap = await heatmap_service_1.HeatmapService.getCampaignHeatmap(blastId);
            res.json({ success: true, heatmap });
        }
        catch (err) {
            next(err);
        }
    }
    /**
     * POST /api/v1/email-blast/client-matrix
     */
    static async checkClientMatrix(req, res, next) {
        try {
            const { html } = req.body;
            if (!html)
                return res.status(400).json({ success: false, error: "html is required" });
            const report = client_preview_service_1.ClientPreviewService.analyzeCompatibility(html);
            res.json({ success: true, report });
        }
        catch (err) {
            next(err);
        }
    }
    /**
     * GET /api/v1/email-blast/components/presets
     * Catálogo de componentes pre-diseñados y reutilizables
     */
    static async getPresets(req, res, next) {
        try {
            const presets = [
                {
                    type: "hero_banner",
                    name: "Hero Banner de Aniversario",
                    description: "Banner promocional de impacto con imagen de fondo y botón CTA",
                    defaultBlock: {
                        type: "hero_banner",
                        imageUrl: "https://images.unsplash.com/photo-1557804506-669a67965ba0",
                        headline: "¡Oferta Exclusiva de Aniversario!",
                        subheadline: "Aprovecha hasta un 50% de descuento en nuestros servicios VIP",
                        ctaText: "Reclamar Oferta",
                        ctaUrl: "https://legacymarksas.com/promocion"
                    }
                },
                {
                    type: "product_card",
                    name: "Tarjeta de Producto",
                    description: "Ficha destacada para promocionar productos o servicios",
                    defaultBlock: {
                        type: "product_card",
                        imageUrl: "https://images.unsplash.com/photo-1523275335684-37898b6baf30",
                        title: "Plan LegacyMark Enterprise",
                        price: "$299 USD",
                        originalPrice: "$499 USD",
                        description: "Acceso completo a todos los microservicios e IA automatizada.",
                        buttonText: "Comprar Ahora",
                        buttonUrl: "https://legacymarksas.com/checkout"
                    }
                },
                {
                    type: "coupon_code",
                    name: "Cupón de Descuento",
                    description: "Caja de código promocional destacado con borde punteado",
                    defaultBlock: {
                        type: "coupon_code",
                        code: "{{discountCode}}",
                        discountText: "Tu código de regalo exclusivo",
                        expiresText: "Válido durante 48 horas únicamente"
                    }
                },
                {
                    type: "testimonial",
                    name: "Testimonio de Cliente",
                    description: "Cita destacada con avatar de autor",
                    defaultBlock: {
                        type: "testimonial",
                        quote: "LegacyMark transformó por completo nuestras ventas de email marketing.",
                        authorName: "Carlos Mendoza",
                        authorTitle: "CEO en TechCorp",
                        avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb"
                    }
                }
            ];
            res.json({ success: true, presets });
        }
        catch (err) {
            next(err);
        }
    }
    /**
     * POST /api/v1/email-blast/compile-preview
     * Compilar bloques e interpolar variables dinámicas para vista previa en tiempo real
     */
    static async compilePreview(req, res, next) {
        try {
            const { designJson, variables } = req.body;
            if (!designJson) {
                return res.status(400).json({ success: false, error: "designJson is required" });
            }
            const compiledHtml = await block_compiler_service_1.BlockCompilerService.compileBlocksToHtmlWithCache(designJson, variables);
            res.json({ success: true, html: compiledHtml });
        }
        catch (err) {
            next(err);
        }
    }
    /**
     * POST /api/v1/email-blast/compile
     * Compilar bloques JSON a HTML responsive en tiempo real
     */
    static async compileBlocks(req, res, next) {
        try {
            const { designJson } = req.body;
            if (!designJson) {
                return res.status(400).json({ success: false, error: "designJson is required" });
            }
            const html = block_compiler_service_1.BlockCompilerService.compileBlocksToHtml(designJson);
            res.json({ success: true, html });
        }
        catch (err) {
            next(err);
        }
    }
    /**
     * GET /api/v1/email-blast/images
     */
    static async getImages(req, res, next) {
        try {
            const companyId = await resolveCompanyId(req);
            if (!companyId) {
                return res.status(400).json({ success: false, error: "companyId is required" });
            }
            const images = await image_manager_service_1.ImageManagerService.getCompanyImages(companyId);
            res.json({ success: true, images });
        }
        catch (err) {
            next(err);
        }
    }
    /**
     * POST /api/v1/email-blast/images/upload
     */
    static async uploadImage(req, res, next) {
        try {
            const companyId = String(req.headers["x-company-id"] || req.body.companyId || "");
            const { url, name, alt, width, height, sizeBytes } = req.body;
            if (!companyId || !url) {
                return res.status(400).json({ success: false, error: "companyId and url are required" });
            }
            const image = await image_manager_service_1.ImageManagerService.registerImage({
                companyId,
                url,
                name: name || "Campaña Imagen",
                alt,
                width,
                height,
                sizeBytes
            });
            res.status(201).json({ success: true, image });
        }
        catch (err) {
            next(err);
        }
    }
    /**
     * POST /api/v1/marketing/generate-copy
     */
    static async generateCopy(req, res, next) {
        try {
            const { topic, channel } = req.body;
            const companyId = await resolveCompanyId(req);
            if (!topic || !channel) {
                return res.status(400).json({ success: false, error: "topic and channel are required" });
            }
            const copy = await marketing_service_1.MarketingService.generateAiCopy(companyId, topic, channel);
            res.json({ success: true, channel, topic, copy });
        }
        catch (err) {
            next(err);
        }
    }
    /**
     * POST /api/v1/marketing/campaigns/visual-builder
     */
    static async saveVisualCampaign(req, res, next) {
        try {
            const { name, layoutJson, channel } = req.body;
            const companyId = await resolveCompanyId(req);
            if (!name || !layoutJson) {
                return res.status(400).json({ success: false, error: "name and layoutJson are required" });
            }
            res.json({
                success: true,
                message: "Visual campaign config saved successfully.",
                campaign: {
                    id: `vis-${Date.now()}`,
                    name,
                    channel: channel || "email",
                    layoutJson,
                    companyId
                }
            });
        }
        catch (err) {
            next(err);
        }
    }
    /**
     * POST /api/v1/marketing/send-omnichannel
     */
    static async sendOmnichannel(req, res, next) {
        try {
            const { name, body, recipients, channel } = req.body;
            const companyId = await resolveCompanyId(req);
            if (!body || !recipients || !Array.isArray(recipients)) {
                return res.status(400).json({ success: false, error: "body and recipients array are required" });
            }
            let result;
            if (channel === "sms") {
                result = await marketing_service_1.MarketingService.sendSmsCampaign(companyId, name || "Campaña SMS", body, recipients);
            }
            else {
                result = await marketing_service_1.MarketingService.sendWhatsAppCampaign(companyId, name || "Campaña WhatsApp", body, recipients);
            }
            res.json({ success: true, ...result });
        }
        catch (err) {
            next(err);
        }
    }
}
exports.MarketingController = MarketingController;
//# sourceMappingURL=marketing.controller.js.map