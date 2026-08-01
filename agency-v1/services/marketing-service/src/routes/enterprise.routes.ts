import { Router, Request, Response, NextFunction } from 'express';

// Import real services
import { AnalyticsService } from '../services/analytics.service';
import { EmailValidatorService } from '../services/email-validator.service';
import { QueueService } from '../services/queue.service';
import { DripSequenceService } from '../services/drip-sequence.service';
import { DomainReputationService } from '../services/domain-reputation.service';
import { ReportExportService } from '../services/report-export.service';
import { SegmentBuilderService } from '../services/segment-builder.service';
import { IntegrationWebhookService } from '../services/integration-webhook.service';
import { TemplateGalleryService } from '../services/template-gallery.service';
import { ComplianceService } from '../services/compliance.service';

export const enterpriseRouter = Router();

function getStr(val: any): string {
  if (!val) return '';
  if (Array.isArray(val)) return String(val[0] || '');
  return String(val);
}

// ══════════════════════════════════════════════════════════════════════════════
// 1. Analytics — Dashboard de Analítica en Tiempo Real
// ══════════════════════════════════════════════════════════════════════════════
enterpriseRouter.get('/analytics/dashboard', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const companyId = getStr(req.headers['x-company-id'] || req.query.companyId);
    const result = await AnalyticsService.getGlobalDashboardStats(companyId);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
});

enterpriseRouter.get('/analytics/campaign/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const companyId = getStr(req.headers['x-company-id'] || req.query.companyId);
    const result = await AnalyticsService.getCampaignAnalytics(getStr(req.params.id), companyId);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
});

enterpriseRouter.get('/analytics/campaign/:id/audience', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await AnalyticsService.getAudienceBreakdown(getStr(req.params.id));
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
});

enterpriseRouter.get('/analytics/campaign/:id/geo', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await AnalyticsService.getGeographicDistribution(getStr(req.params.id));
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
});

enterpriseRouter.post('/analytics/compare', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const companyId = getStr(req.headers['x-company-id'] || req.body.companyId);
    const result = await AnalyticsService.getCampaignComparison(companyId, req.body.blastIds || []);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
});

// ══════════════════════════════════════════════════════════════════════════════
// 7. Validación de Emails en Tiempo Real
// ══════════════════════════════════════════════════════════════════════════════
enterpriseRouter.post('/email-validation/validate', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await EmailValidatorService.validateEmail(getStr(req.body.email));
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
});

enterpriseRouter.post('/email-validation/validate-batch', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await EmailValidatorService.validateBatch(req.body.emails || []);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
});

// ══════════════════════════════════════════════════════════════════════════════
// 10. Cola de Envío con Prioridades
// ══════════════════════════════════════════════════════════════════════════════
enterpriseRouter.get('/queue/status', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const companyId = getStr(req.headers['x-company-id'] || req.query.companyId);
    const result = await QueueService.getQueueStatus(companyId);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
});

enterpriseRouter.post('/queue/enqueue', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { blastId, companyId, priority, scheduledAt } = req.body;
    const result = await QueueService.enqueue(getStr(blastId), getStr(companyId), priority || 0, scheduledAt ? new Date(scheduledAt) : undefined);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
});

// ══════════════════════════════════════════════════════════════════════════════
// 2. Campañas de Goteo / Drip Sequences
// ══════════════════════════════════════════════════════════════════════════════
enterpriseRouter.get('/sequences', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const companyId = getStr(req.headers['x-company-id'] || req.query.companyId);
    const result = await DripSequenceService.getSequences(companyId);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
});

enterpriseRouter.post('/sequences', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { companyId, name, trigger, steps } = req.body;
    const result = await DripSequenceService.createSequence(getStr(companyId), getStr(name), getStr(trigger), steps || []);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
});

enterpriseRouter.get('/sequences/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await DripSequenceService.getSequence(getStr(req.params.id));
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
});

enterpriseRouter.post('/sequences/:id/steps', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await DripSequenceService.addStep(getStr(req.params.id), req.body);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
});

enterpriseRouter.post('/sequences/:id/enroll', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, name } = req.body;
    const result = await DripSequenceService.enrollContact(getStr(req.params.id), getStr(email), name ? getStr(name) : undefined);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
});

// ══════════════════════════════════════════════════════════════════════════════
// 4. Gestión de Reputación del Dominio
// ══════════════════════════════════════════════════════════════════════════════
enterpriseRouter.get('/domain-reputation/check', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const domain = getStr(req.query.domain);
    const [blacklists, auth] = await Promise.all([
      DomainReputationService.checkBlacklists(domain),
      DomainReputationService.checkDmarcDkimSpf(domain)
    ]);
    res.json({ success: true, data: { blacklists, authentication: auth } });
  } catch (err) { next(err); }
});

enterpriseRouter.get('/domain-reputation/sender-score', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const companyId = getStr(req.headers['x-company-id'] || req.query.companyId);
    const result = await DomainReputationService.getSenderScore(companyId);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
});

enterpriseRouter.get('/domain-reputation/full-report', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const domain = getStr(req.query.domain);
    const companyId = getStr(req.headers['x-company-id'] || req.query.companyId);
    const result = await DomainReputationService.getFullReputationReport(domain, companyId);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
});

// ══════════════════════════════════════════════════════════════════════════════
// 8. Exportación de Reportes
// ══════════════════════════════════════════════════════════════════════════════
enterpriseRouter.get('/reports/campaign/:id/html', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const html = await ReportExportService.generateCampaignReportHtml(getStr(req.params.id));
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  } catch (err) { next(err); }
});

enterpriseRouter.get('/reports/campaign/:id/csv', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const csv = await ReportExportService.generateCampaignCsv(getStr(req.params.id));
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="campaign-${getStr(req.params.id)}.csv"`);
    res.send(csv);
  } catch (err) { next(err); }
});

enterpriseRouter.get('/reports/executive', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const companyId = getStr(req.headers['x-company-id'] || req.query.companyId);
    const result = await ReportExportService.generateExecutiveSummary(companyId);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
});

enterpriseRouter.get('/reports/contact-timeline', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const email = getStr(req.query.email);
    const companyId = getStr(req.headers['x-company-id'] || req.query.companyId);
    const result = await ReportExportService.getContactTimeline(email, companyId);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
});

// ══════════════════════════════════════════════════════════════════════════════
// 6. Segmentación Avanzada de Audiencias
// ══════════════════════════════════════════════════════════════════════════════
enterpriseRouter.get('/segments', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const companyId = getStr(req.headers['x-company-id'] || req.query.companyId);
    const result = await SegmentBuilderService.getSegments(companyId);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
});

enterpriseRouter.post('/segments', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { companyId, name, rules } = req.body;
    const result = await SegmentBuilderService.createSegment(getStr(companyId), getStr(name), rules || []);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
});

enterpriseRouter.get('/segments/:id/evaluate', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await SegmentBuilderService.evaluateSegment(getStr(req.params.id));
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
});

enterpriseRouter.get('/segments/:id/contacts', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(getStr(req.query.page)) || 1;
    const limit = parseInt(getStr(req.query.limit)) || 50;
    const result = await SegmentBuilderService.getSegmentContacts(getStr(req.params.id), page, limit);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
});

enterpriseRouter.post('/segments/activity', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const companyId = getStr(req.headers['x-company-id'] || req.body.companyId);
    const result = await SegmentBuilderService.getActivityBasedSegment(companyId, req.body.criteria);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
});

// ══════════════════════════════════════════════════════════════════════════════
// 9. Integraciones Nativas — Webhooks Configurables
// ══════════════════════════════════════════════════════════════════════════════
enterpriseRouter.get('/integrations/webhooks', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const companyId = getStr(req.headers['x-company-id'] || req.query.companyId);
    const result = await IntegrationWebhookService.getWebhooks(companyId);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
});

enterpriseRouter.post('/integrations/webhooks', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { companyId, url, events, secret } = req.body;
    const result = await IntegrationWebhookService.registerWebhook(getStr(companyId), getStr(url), events || [], secret ? getStr(secret) : undefined);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
});

enterpriseRouter.delete('/integrations/webhooks/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await IntegrationWebhookService.deleteWebhook(getStr(req.params.id));
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
});

enterpriseRouter.post('/integrations/webhooks/:id/test', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await IntegrationWebhookService.testWebhook(getStr(req.params.id));
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
});

// ══════════════════════════════════════════════════════════════════════════════
// 5. Galería de Plantillas con Categorías
// ══════════════════════════════════════════════════════════════════════════════
enterpriseRouter.get('/templates', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const companyId = getStr(req.headers['x-company-id'] || req.query.companyId);
    const category = getStr(req.query.category);
    const result = await TemplateGalleryService.getTemplates(companyId, category);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
});

enterpriseRouter.get('/templates/system', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const result = TemplateGalleryService.getSystemTemplates();
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
});

enterpriseRouter.get('/templates/categories', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const result = TemplateGalleryService.getCategories();
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
});

enterpriseRouter.get('/templates/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await TemplateGalleryService.getTemplate(getStr(req.params.id));
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
});

enterpriseRouter.post('/templates', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const companyId = getStr(req.headers['x-company-id'] || req.body.companyId);
    const result = await TemplateGalleryService.createTemplate(companyId, req.body);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
});

enterpriseRouter.post('/templates/:id/clone', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const companyId = getStr(req.headers['x-company-id'] || req.body.companyId);
    const result = await TemplateGalleryService.cloneTemplate(getStr(req.params.id), companyId);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
});

// ══════════════════════════════════════════════════════════════════════════════
// 12. Compliance y Privacidad — GDPR / CAN-SPAM
// ══════════════════════════════════════════════════════════════════════════════
enterpriseRouter.post('/compliance/consent', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, companyId, source, ipAddress } = req.body;
    const result = await ComplianceService.recordConsent(getStr(email), getStr(companyId), getStr(source), ipAddress ? getStr(ipAddress) : undefined);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
});

enterpriseRouter.get('/compliance/consent', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const email = getStr(req.query.email);
    const companyId = getStr(req.headers['x-company-id'] || req.query.companyId);
    const result = await ComplianceService.getConsentLog(email, companyId);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
});

enterpriseRouter.get('/compliance/preferences', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const email = getStr(req.query.email);
    const companyId = getStr(req.headers['x-company-id'] || req.query.companyId);
    const result = await ComplianceService.getPreferenceCenter(email, companyId);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
});

enterpriseRouter.put('/compliance/preferences', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, companyId, preferences } = req.body;
    const result = await ComplianceService.updatePreferences(getStr(email), getStr(companyId), preferences || {});
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
});

enterpriseRouter.get('/compliance/expired-lists', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const companyId = getStr(req.headers['x-company-id'] || req.query.companyId);
    const days = parseInt(getStr(req.query.days)) || 90;
    const result = await ComplianceService.getExpiredLists(companyId, days);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
});

enterpriseRouter.get('/compliance/gdpr-report', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const email = getStr(req.query.email);
    const companyId = getStr(req.headers['x-company-id'] || req.query.companyId);
    const result = await ComplianceService.generateGdprReport(email, companyId);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
});

enterpriseRouter.delete('/compliance/contact-data', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const email = getStr(req.query.email);
    const companyId = getStr(req.headers['x-company-id'] || req.query.companyId);
    const result = await ComplianceService.deleteContactData(email, companyId);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
});
