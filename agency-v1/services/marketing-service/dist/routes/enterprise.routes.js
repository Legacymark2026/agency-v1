"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.enterpriseRouter = void 0;
const express_1 = require("express");
// Import real services
const analytics_service_1 = require("../services/analytics.service");
const email_validator_service_1 = require("../services/email-validator.service");
const queue_service_1 = require("../services/queue.service");
const drip_sequence_service_1 = require("../services/drip-sequence.service");
const domain_reputation_service_1 = require("../services/domain-reputation.service");
const report_export_service_1 = require("../services/report-export.service");
const segment_builder_service_1 = require("../services/segment-builder.service");
const integration_webhook_service_1 = require("../services/integration-webhook.service");
const template_gallery_service_1 = require("../services/template-gallery.service");
const compliance_service_1 = require("../services/compliance.service");
exports.enterpriseRouter = (0, express_1.Router)();
function getStr(val) {
    if (!val)
        return '';
    if (Array.isArray(val))
        return String(val[0] || '');
    return String(val);
}
// ══════════════════════════════════════════════════════════════════════════════
// 1. Analytics — Dashboard de Analítica en Tiempo Real
// ══════════════════════════════════════════════════════════════════════════════
exports.enterpriseRouter.get('/analytics/dashboard', async (req, res, next) => {
    try {
        const companyId = getStr(req.headers['x-company-id'] || req.query.companyId);
        const result = await analytics_service_1.AnalyticsService.getGlobalDashboardStats(companyId);
        res.json({ success: true, data: result });
    }
    catch (err) {
        next(err);
    }
});
exports.enterpriseRouter.get('/analytics/campaign/:id', async (req, res, next) => {
    try {
        const companyId = getStr(req.headers['x-company-id'] || req.query.companyId);
        const result = await analytics_service_1.AnalyticsService.getCampaignAnalytics(getStr(req.params.id), companyId);
        res.json({ success: true, data: result });
    }
    catch (err) {
        next(err);
    }
});
exports.enterpriseRouter.get('/analytics/campaign/:id/audience', async (req, res, next) => {
    try {
        const result = await analytics_service_1.AnalyticsService.getAudienceBreakdown(getStr(req.params.id));
        res.json({ success: true, data: result });
    }
    catch (err) {
        next(err);
    }
});
exports.enterpriseRouter.get('/analytics/campaign/:id/geo', async (req, res, next) => {
    try {
        const result = await analytics_service_1.AnalyticsService.getGeographicDistribution(getStr(req.params.id));
        res.json({ success: true, data: result });
    }
    catch (err) {
        next(err);
    }
});
exports.enterpriseRouter.post('/analytics/compare', async (req, res, next) => {
    try {
        const companyId = getStr(req.headers['x-company-id'] || req.body.companyId);
        const result = await analytics_service_1.AnalyticsService.getCampaignComparison(companyId, req.body.blastIds || []);
        res.json({ success: true, data: result });
    }
    catch (err) {
        next(err);
    }
});
// ══════════════════════════════════════════════════════════════════════════════
// 7. Validación de Emails en Tiempo Real
// ══════════════════════════════════════════════════════════════════════════════
exports.enterpriseRouter.post('/email-validation/validate', async (req, res, next) => {
    try {
        const result = await email_validator_service_1.EmailValidatorService.validateEmail(getStr(req.body.email));
        res.json({ success: true, data: result });
    }
    catch (err) {
        next(err);
    }
});
exports.enterpriseRouter.post('/email-validation/validate-batch', async (req, res, next) => {
    try {
        const result = await email_validator_service_1.EmailValidatorService.validateBatch(req.body.emails || []);
        res.json({ success: true, data: result });
    }
    catch (err) {
        next(err);
    }
});
// ══════════════════════════════════════════════════════════════════════════════
// 10. Cola de Envío con Prioridades
// ══════════════════════════════════════════════════════════════════════════════
exports.enterpriseRouter.get('/queue/status', async (req, res, next) => {
    try {
        const companyId = getStr(req.headers['x-company-id'] || req.query.companyId);
        const result = await queue_service_1.QueueService.getQueueStatus(companyId);
        res.json({ success: true, data: result });
    }
    catch (err) {
        next(err);
    }
});
exports.enterpriseRouter.post('/queue/enqueue', async (req, res, next) => {
    try {
        const { blastId, companyId, priority, scheduledAt } = req.body;
        const result = await queue_service_1.QueueService.enqueue(getStr(blastId), getStr(companyId), priority || 0, scheduledAt ? new Date(scheduledAt) : undefined);
        res.json({ success: true, data: result });
    }
    catch (err) {
        next(err);
    }
});
// ══════════════════════════════════════════════════════════════════════════════
// 2. Campañas de Goteo / Drip Sequences
// ══════════════════════════════════════════════════════════════════════════════
exports.enterpriseRouter.get('/sequences', async (req, res, next) => {
    try {
        const companyId = getStr(req.headers['x-company-id'] || req.query.companyId);
        const result = await drip_sequence_service_1.DripSequenceService.getSequences(companyId);
        res.json({ success: true, data: result });
    }
    catch (err) {
        next(err);
    }
});
exports.enterpriseRouter.post('/sequences', async (req, res, next) => {
    try {
        const { companyId, name, trigger, steps } = req.body;
        const result = await drip_sequence_service_1.DripSequenceService.createSequence(getStr(companyId), getStr(name), getStr(trigger), steps || []);
        res.json({ success: true, data: result });
    }
    catch (err) {
        next(err);
    }
});
exports.enterpriseRouter.get('/sequences/:id', async (req, res, next) => {
    try {
        const result = await drip_sequence_service_1.DripSequenceService.getSequence(getStr(req.params.id));
        res.json({ success: true, data: result });
    }
    catch (err) {
        next(err);
    }
});
exports.enterpriseRouter.post('/sequences/:id/steps', async (req, res, next) => {
    try {
        const result = await drip_sequence_service_1.DripSequenceService.addStep(getStr(req.params.id), req.body);
        res.json({ success: true, data: result });
    }
    catch (err) {
        next(err);
    }
});
exports.enterpriseRouter.post('/sequences/:id/enroll', async (req, res, next) => {
    try {
        const { email, name } = req.body;
        const result = await drip_sequence_service_1.DripSequenceService.enrollContact(getStr(req.params.id), getStr(email), name ? getStr(name) : undefined);
        res.json({ success: true, data: result });
    }
    catch (err) {
        next(err);
    }
});
// ══════════════════════════════════════════════════════════════════════════════
// 4. Gestión de Reputación del Dominio
// ══════════════════════════════════════════════════════════════════════════════
exports.enterpriseRouter.get('/domain-reputation/check', async (req, res, next) => {
    try {
        const domain = getStr(req.query.domain);
        const [blacklists, auth] = await Promise.all([
            domain_reputation_service_1.DomainReputationService.checkBlacklists(domain),
            domain_reputation_service_1.DomainReputationService.checkDmarcDkimSpf(domain)
        ]);
        res.json({ success: true, data: { blacklists, authentication: auth } });
    }
    catch (err) {
        next(err);
    }
});
exports.enterpriseRouter.get('/domain-reputation/sender-score', async (req, res, next) => {
    try {
        const companyId = getStr(req.headers['x-company-id'] || req.query.companyId);
        const result = await domain_reputation_service_1.DomainReputationService.getSenderScore(companyId);
        res.json({ success: true, data: result });
    }
    catch (err) {
        next(err);
    }
});
exports.enterpriseRouter.get('/domain-reputation/full-report', async (req, res, next) => {
    try {
        const domain = getStr(req.query.domain);
        const companyId = getStr(req.headers['x-company-id'] || req.query.companyId);
        const result = await domain_reputation_service_1.DomainReputationService.getFullReputationReport(domain, companyId);
        res.json({ success: true, data: result });
    }
    catch (err) {
        next(err);
    }
});
// ══════════════════════════════════════════════════════════════════════════════
// 8. Exportación de Reportes
// ══════════════════════════════════════════════════════════════════════════════
exports.enterpriseRouter.get('/reports/campaign/:id/html', async (req, res, next) => {
    try {
        const html = await report_export_service_1.ReportExportService.generateCampaignReportHtml(getStr(req.params.id));
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.send(html);
    }
    catch (err) {
        next(err);
    }
});
exports.enterpriseRouter.get('/reports/campaign/:id/csv', async (req, res, next) => {
    try {
        const csv = await report_export_service_1.ReportExportService.generateCampaignCsv(getStr(req.params.id));
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="campaign-${getStr(req.params.id)}.csv"`);
        res.send(csv);
    }
    catch (err) {
        next(err);
    }
});
exports.enterpriseRouter.get('/reports/executive', async (req, res, next) => {
    try {
        const companyId = getStr(req.headers['x-company-id'] || req.query.companyId);
        const result = await report_export_service_1.ReportExportService.generateExecutiveSummary(companyId);
        res.json({ success: true, data: result });
    }
    catch (err) {
        next(err);
    }
});
exports.enterpriseRouter.get('/reports/contact-timeline', async (req, res, next) => {
    try {
        const email = getStr(req.query.email);
        const companyId = getStr(req.headers['x-company-id'] || req.query.companyId);
        const result = await report_export_service_1.ReportExportService.getContactTimeline(email, companyId);
        res.json({ success: true, data: result });
    }
    catch (err) {
        next(err);
    }
});
// ══════════════════════════════════════════════════════════════════════════════
// 6. Segmentación Avanzada de Audiencias
// ══════════════════════════════════════════════════════════════════════════════
exports.enterpriseRouter.get('/segments', async (req, res, next) => {
    try {
        const companyId = getStr(req.headers['x-company-id'] || req.query.companyId);
        const result = await segment_builder_service_1.SegmentBuilderService.getSegments(companyId);
        res.json({ success: true, data: result });
    }
    catch (err) {
        next(err);
    }
});
exports.enterpriseRouter.post('/segments', async (req, res, next) => {
    try {
        const { companyId, name, rules } = req.body;
        const result = await segment_builder_service_1.SegmentBuilderService.createSegment(getStr(companyId), getStr(name), rules || []);
        res.json({ success: true, data: result });
    }
    catch (err) {
        next(err);
    }
});
exports.enterpriseRouter.get('/segments/:id/evaluate', async (req, res, next) => {
    try {
        const result = await segment_builder_service_1.SegmentBuilderService.evaluateSegment(getStr(req.params.id));
        res.json({ success: true, data: result });
    }
    catch (err) {
        next(err);
    }
});
exports.enterpriseRouter.get('/segments/:id/contacts', async (req, res, next) => {
    try {
        const page = parseInt(getStr(req.query.page)) || 1;
        const limit = parseInt(getStr(req.query.limit)) || 50;
        const result = await segment_builder_service_1.SegmentBuilderService.getSegmentContacts(getStr(req.params.id), page, limit);
        res.json({ success: true, data: result });
    }
    catch (err) {
        next(err);
    }
});
exports.enterpriseRouter.post('/segments/activity', async (req, res, next) => {
    try {
        const companyId = getStr(req.headers['x-company-id'] || req.body.companyId);
        const result = await segment_builder_service_1.SegmentBuilderService.getActivityBasedSegment(companyId, req.body.criteria);
        res.json({ success: true, data: result });
    }
    catch (err) {
        next(err);
    }
});
// ══════════════════════════════════════════════════════════════════════════════
// 9. Integraciones Nativas — Webhooks Configurables
// ══════════════════════════════════════════════════════════════════════════════
exports.enterpriseRouter.get('/integrations/webhooks', async (req, res, next) => {
    try {
        const companyId = getStr(req.headers['x-company-id'] || req.query.companyId);
        const result = await integration_webhook_service_1.IntegrationWebhookService.getWebhooks(companyId);
        res.json({ success: true, data: result });
    }
    catch (err) {
        next(err);
    }
});
exports.enterpriseRouter.post('/integrations/webhooks', async (req, res, next) => {
    try {
        const { companyId, url, events, secret } = req.body;
        const result = await integration_webhook_service_1.IntegrationWebhookService.registerWebhook(getStr(companyId), getStr(url), events || [], secret ? getStr(secret) : undefined);
        res.json({ success: true, data: result });
    }
    catch (err) {
        next(err);
    }
});
exports.enterpriseRouter.delete('/integrations/webhooks/:id', async (req, res, next) => {
    try {
        const result = await integration_webhook_service_1.IntegrationWebhookService.deleteWebhook(getStr(req.params.id));
        res.json({ success: true, data: result });
    }
    catch (err) {
        next(err);
    }
});
exports.enterpriseRouter.post('/integrations/webhooks/:id/test', async (req, res, next) => {
    try {
        const result = await integration_webhook_service_1.IntegrationWebhookService.testWebhook(getStr(req.params.id));
        res.json({ success: true, data: result });
    }
    catch (err) {
        next(err);
    }
});
// ══════════════════════════════════════════════════════════════════════════════
// 5. Galería de Plantillas con Categorías
// ══════════════════════════════════════════════════════════════════════════════
exports.enterpriseRouter.get('/templates', async (req, res, next) => {
    try {
        const companyId = getStr(req.headers['x-company-id'] || req.query.companyId);
        const category = getStr(req.query.category);
        const result = await template_gallery_service_1.TemplateGalleryService.getTemplates(companyId, category);
        res.json({ success: true, data: result });
    }
    catch (err) {
        next(err);
    }
});
exports.enterpriseRouter.get('/templates/system', async (_req, res, next) => {
    try {
        const result = template_gallery_service_1.TemplateGalleryService.getSystemTemplates();
        res.json({ success: true, data: result });
    }
    catch (err) {
        next(err);
    }
});
exports.enterpriseRouter.get('/templates/categories', async (_req, res, next) => {
    try {
        const result = template_gallery_service_1.TemplateGalleryService.getCategories();
        res.json({ success: true, data: result });
    }
    catch (err) {
        next(err);
    }
});
exports.enterpriseRouter.get('/templates/:id', async (req, res, next) => {
    try {
        const result = await template_gallery_service_1.TemplateGalleryService.getTemplate(getStr(req.params.id));
        res.json({ success: true, data: result });
    }
    catch (err) {
        next(err);
    }
});
exports.enterpriseRouter.post('/templates', async (req, res, next) => {
    try {
        const companyId = getStr(req.headers['x-company-id'] || req.body.companyId);
        const result = await template_gallery_service_1.TemplateGalleryService.createTemplate(companyId, req.body);
        res.json({ success: true, data: result });
    }
    catch (err) {
        next(err);
    }
});
exports.enterpriseRouter.post('/templates/:id/clone', async (req, res, next) => {
    try {
        const companyId = getStr(req.headers['x-company-id'] || req.body.companyId);
        const result = await template_gallery_service_1.TemplateGalleryService.cloneTemplate(getStr(req.params.id), companyId);
        res.json({ success: true, data: result });
    }
    catch (err) {
        next(err);
    }
});
// ══════════════════════════════════════════════════════════════════════════════
// 12. Compliance y Privacidad — GDPR / CAN-SPAM
// ══════════════════════════════════════════════════════════════════════════════
exports.enterpriseRouter.post('/compliance/consent', async (req, res, next) => {
    try {
        const { email, companyId, source, ipAddress } = req.body;
        const result = await compliance_service_1.ComplianceService.recordConsent(getStr(email), getStr(companyId), getStr(source), ipAddress ? getStr(ipAddress) : undefined);
        res.json({ success: true, data: result });
    }
    catch (err) {
        next(err);
    }
});
exports.enterpriseRouter.get('/compliance/consent', async (req, res, next) => {
    try {
        const email = getStr(req.query.email);
        const companyId = getStr(req.headers['x-company-id'] || req.query.companyId);
        const result = await compliance_service_1.ComplianceService.getConsentLog(email, companyId);
        res.json({ success: true, data: result });
    }
    catch (err) {
        next(err);
    }
});
exports.enterpriseRouter.get('/compliance/preferences', async (req, res, next) => {
    try {
        const email = getStr(req.query.email);
        const companyId = getStr(req.headers['x-company-id'] || req.query.companyId);
        const result = await compliance_service_1.ComplianceService.getPreferenceCenter(email, companyId);
        res.json({ success: true, data: result });
    }
    catch (err) {
        next(err);
    }
});
exports.enterpriseRouter.put('/compliance/preferences', async (req, res, next) => {
    try {
        const { email, companyId, preferences } = req.body;
        const result = await compliance_service_1.ComplianceService.updatePreferences(getStr(email), getStr(companyId), preferences || {});
        res.json({ success: true, data: result });
    }
    catch (err) {
        next(err);
    }
});
exports.enterpriseRouter.get('/compliance/expired-lists', async (req, res, next) => {
    try {
        const companyId = getStr(req.headers['x-company-id'] || req.query.companyId);
        const days = parseInt(getStr(req.query.days)) || 90;
        const result = await compliance_service_1.ComplianceService.getExpiredLists(companyId, days);
        res.json({ success: true, data: result });
    }
    catch (err) {
        next(err);
    }
});
exports.enterpriseRouter.get('/compliance/gdpr-report', async (req, res, next) => {
    try {
        const email = getStr(req.query.email);
        const companyId = getStr(req.headers['x-company-id'] || req.query.companyId);
        const result = await compliance_service_1.ComplianceService.generateGdprReport(email, companyId);
        res.json({ success: true, data: result });
    }
    catch (err) {
        next(err);
    }
});
exports.enterpriseRouter.delete('/compliance/contact-data', async (req, res, next) => {
    try {
        const email = getStr(req.query.email);
        const companyId = getStr(req.headers['x-company-id'] || req.query.companyId);
        const result = await compliance_service_1.ComplianceService.deleteContactData(email, companyId);
        res.json({ success: true, data: result });
    }
    catch (err) {
        next(err);
    }
});
//# sourceMappingURL=enterprise.routes.js.map