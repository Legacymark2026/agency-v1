import { Request, Response, NextFunction } from "express";
import { prisma } from "@agency/database";
import { MarketingService } from "../services/marketing.service";
import { DnsValidatorService } from "../services/dns-validator";
import { AiOptimizerService } from "../services/ai-optimizer.service";
import { SuppressionService } from "../services/suppression.service";
import { BlockCompilerService } from "../services/block-compiler.service";
import { ImageManagerService } from "../services/image-manager.service";
import { AbTestingService } from "../services/ab-testing.service";
import { HeatmapService } from "../services/heatmap.service";
import { ClientPreviewService } from "../services/client-preview.service";
import { TimezoneDeliveryService } from "../services/timezone-delivery.service";
import { RssAutomationService } from "../services/rss-automation.service";

async function resolveCompanyId(req: Request): Promise<string> {
  const explicitId = String(
    req.headers["x-company-id"] || req.query.companyId || req.body?.companyId || ""
  ).trim();
  if (explicitId) return explicitId;

  try {
    const firstCompany = await (prisma as any).company.findFirst({ select: { id: true } });
    if (firstCompany?.id) return firstCompany.id;
  } catch (e) {
    console.warn("[resolveCompanyId] Database lookup warning:", e);
  }
  return "";
}

export class MarketingController {
  /**
   * GET /api/v1/email-blast
   */
  static async getEmailBlasts(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = await resolveCompanyId(req);
      if (!companyId) {
        return res.status(400).json({ success: false, error: "companyId is required" });
      }

      const blasts = await MarketingService.getEmailBlasts(companyId);
      res.json(blasts);
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/email-blast
   */
  static async createEmailBlast(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = await resolveCompanyId(req);
      if (!companyId) {
        return res.status(400).json({ success: false, error: "companyId is required" });
      }

      const result = await MarketingService.createEmailBlast({
        ...req.body,
        companyId
      });

      res.status(201).json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/email-blast/:id
   */
  static async getEmailBlast(req: Request, res: Response, next: NextFunction) {
    try {
      const blastId = String(req.params.id);
      const companyId = await resolveCompanyId(req);
      if (!companyId) {
        return res.status(400).json({ success: false, error: "companyId is required" });
      }

      const blast = await MarketingService.getEmailBlast(blastId, companyId);
      if (!blast) return res.status(404).json({ success: false, error: "Campaña no encontrada" });
      res.json(blast);
    } catch (err) {
      next(err);
    }
  }

  /**
   * DELETE /api/v1/email-blast/:id
   */
  static async deleteEmailBlast(req: Request, res: Response, next: NextFunction) {
    try {
      const blastId = String(req.params.id);
      const companyId = await resolveCompanyId(req);
      if (!companyId) {
        return res.status(400).json({ success: false, error: "companyId is required" });
      }

      await MarketingService.deleteEmailBlast(blastId, companyId);
      res.json({ success: true, message: "Campaña eliminada exitosamente" });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/email-blast/bulk-delete
   */
  static async bulkDeleteEmailBlasts(req: Request, res: Response, next: NextFunction) {
    try {
      const { blastIds } = req.body;
      const companyId = await resolveCompanyId(req);
      if (!companyId || !Array.isArray(blastIds)) {
        return res.status(400).json({ success: false, error: "companyId and blastIds array are required" });
      }

      await MarketingService.bulkDeleteEmailBlasts(blastIds, companyId);
      res.json({ success: true, message: "Campañas eliminadas exitosamente" });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/email-blast/:id/clone
   */
  static async cloneEmailBlast(req: Request, res: Response, next: NextFunction) {
    try {
      const blastId = String(req.params.id);
      const companyId = await resolveCompanyId(req);
      const createdById = String(req.body.userId || "system");

      if (!companyId) {
        return res.status(400).json({ success: false, error: "companyId is required" });
      }

      const cloned = await MarketingService.cloneEmailBlast(blastId, companyId, createdById);
      res.status(201).json({ success: true, cloned });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/email-blast/:id/send
   */
  static async sendEmailBlast(req: Request, res: Response, next: NextFunction) {
    try {
      const blastId = String(req.params.id);
      const companyId = await resolveCompanyId(req);
      const baseUrl = `${req.protocol}://${req.get("host")}`;

      if (!companyId) {
        return res.status(400).json({ success: false, error: "companyId is required" });
      }

      const result = await MarketingService.sendEmailBlast(blastId, companyId, baseUrl);
      res.json({ success: true, result });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/email-blast/dns-check
   */
  static async checkDns(req: Request, res: Response, next: NextFunction) {
    try {
      const targetDomain = typeof req.query.domain === "string" 
        ? req.query.domain 
        : (typeof req.body?.domain === "string" ? req.body.domain : "legacymarksas.com");
      const result = await DnsValidatorService.checkDomain(targetDomain);
      res.json({ success: true, result });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/email-blast/spam-check
   */
  static async analyzeSpam(req: Request, res: Response, next: NextFunction) {
    try {
      const { subject, htmlBody } = req.body;
      const result = AiOptimizerService.analyzeSpamScore(subject || "", htmlBody || "");
      res.json({ success: true, result });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/email-blast/ai-generate
   */
  static async aiGenerateSubjects(req: Request, res: Response, next: NextFunction) {
    try {
      const { topic, tone, audience } = req.body;
      if (!topic) {
        return res.status(400).json({ success: false, error: "topic is required" });
      }

      const result = await AiOptimizerService.generateSubjectLines({ topic, tone, audience });
      res.json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/email-blast/suppression-list
   */
  static async getSuppressionList(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = await resolveCompanyId(req);
      if (!companyId) {
        return res.status(400).json({ success: false, error: "companyId is required" });
      }

      const list = await SuppressionService.getSuppressionList(companyId);
      res.json({ success: true, list });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/email-blast/suppression-list
   */
  static async addToSuppression(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = String(req.headers["x-company-id"] || req.body.companyId || "");
      const { email, reason } = req.body;

      if (!companyId || !email) {
        return res.status(400).json({ success: false, error: "companyId and email are required" });
      }

      const entry = await SuppressionService.addToSuppression(companyId, email, reason || "Manual Addition");
      res.status(201).json({ success: true, entry });
    } catch (err) {
      next(err);
    }
  }

  /**
   * DELETE /api/v1/email-blast/suppression-list
   */
  static async removeFromSuppression(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = String(req.headers["x-company-id"] || req.query.companyId || req.body.companyId || "");
      const email = String(req.query.email || req.body.email || "");

      if (!companyId || !email) {
        return res.status(400).json({ success: false, error: "companyId and email are required" });
      }

      await SuppressionService.removeFromSuppression(companyId, email);
      res.json({ success: true });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/email-blast/timezone-schedule
   */
  static async timezoneSchedule(req: Request, res: Response, next: NextFunction) {
    try {
      const { recipients, targetHour } = req.body;
      if (!recipients || !Array.isArray(recipients)) {
        return res.status(400).json({ success: false, error: "recipients array is required" });
      }

      const groups = TimezoneDeliveryService.groupRecipientsByTimezone(recipients, targetHour || 9);
      res.json({ success: true, groups });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/email-blast/rss-generate
   */
  static async rssGenerate(req: Request, res: Response, next: NextFunction) {
    try {
      const { companyName, articles } = req.body;
      if (!articles || !Array.isArray(articles)) {
        return res.status(400).json({ success: false, error: "articles array is required" });
      }

      const result = RssAutomationService.generateNewsletterFromArticles(companyName || "LegacyMark", articles);
      res.json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/email-blast/ab-evaluate
   */
  static async evaluateAbTest(req: Request, res: Response, next: NextFunction) {
    try {
      const { blastId, metricGoal } = req.body;
      if (!blastId) return res.status(400).json({ success: false, error: "blastId is required" });

      const metrics = await AbTestingService.evaluateAbWinner(blastId, metricGoal || "OPENS");
      res.json({ success: true, metrics });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/email-blast/:id/heatmap
   */
  static async getHeatmap(req: Request, res: Response, next: NextFunction) {
    try {
      const blastId = String(req.params.id || "");
      if (!blastId) return res.status(400).json({ success: false, error: "blastId is required" });

      const heatmap = await HeatmapService.getCampaignHeatmap(blastId);
      res.json({ success: true, heatmap });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/email-blast/client-matrix
   */
  static async checkClientMatrix(req: Request, res: Response, next: NextFunction) {
    try {
      const { html } = req.body;
      if (!html) return res.status(400).json({ success: false, error: "html is required" });

      const report = ClientPreviewService.analyzeCompatibility(html);
      res.json({ success: true, report });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/email-blast/components/presets
   * Catálogo de componentes pre-diseñados y reutilizables
   */
  static async getPresets(req: Request, res: Response, next: NextFunction) {
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
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/email-blast/compile-preview
   * Compilar bloques e interpolar variables dinámicas para vista previa en tiempo real
   */
  static async compilePreview(req: Request, res: Response, next: NextFunction) {
    try {
      const { designJson, variables } = req.body;
      if (!designJson) {
        return res.status(400).json({ success: false, error: "designJson is required" });
      }

      const compiledHtml = await BlockCompilerService.compileBlocksToHtmlWithCache(designJson, variables);
      res.json({ success: true, html: compiledHtml });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/email-blast/compile
   * Compilar bloques JSON a HTML responsive en tiempo real
   */
  static async compileBlocks(req: Request, res: Response, next: NextFunction) {
    try {
      const { designJson } = req.body;
      if (!designJson) {
        return res.status(400).json({ success: false, error: "designJson is required" });
      }

      const html = BlockCompilerService.compileBlocksToHtml(designJson);
      res.json({ success: true, html });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/email-blast/images
   */
  static async getImages(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = await resolveCompanyId(req);
      if (!companyId) {
        return res.status(400).json({ success: false, error: "companyId is required" });
      }

      const images = await ImageManagerService.getCompanyImages(companyId);
      res.json({ success: true, images });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/email-blast/images/upload
   */
  static async uploadImage(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = String(req.headers["x-company-id"] || req.body.companyId || "");
      const { url, name, alt, width, height, sizeBytes } = req.body;

      if (!companyId || !url) {
        return res.status(400).json({ success: false, error: "companyId and url are required" });
      }

      const image = await ImageManagerService.registerImage({
        companyId,
        url,
        name: name || "Campaña Imagen",
        alt,
        width,
        height,
        sizeBytes
      });

      res.status(201).json({ success: true, image });
    } catch (err) {
      next(err);
    }
  }
}
