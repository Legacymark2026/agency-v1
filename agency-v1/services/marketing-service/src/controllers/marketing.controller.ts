import { Request, Response, NextFunction } from "express";
import { MarketingService } from "../services/marketing.service";
import { DnsValidatorService } from "../services/dns-validator";
import { AiOptimizerService } from "../services/ai-optimizer.service";
import { SuppressionService } from "../services/suppression.service";
import { BlockCompilerService } from "../services/block-compiler.service";
import { ImageManagerService } from "../services/image-manager.service";

export class MarketingController {
  /**
   * GET /api/v1/email-blast
   */
  static async getEmailBlasts(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = String(req.headers["x-company-id"] || req.query.companyId || "");
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
      const companyId = String(req.headers["x-company-id"] || req.body.companyId || "");
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
   * POST /api/v1/email-blast/:id/send
   */
  static async sendEmailBlast(req: Request, res: Response, next: NextFunction) {
    try {
      const blastId = String(req.params.id);
      const companyId = String(req.headers["x-company-id"] || req.body.companyId || "");
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
      const companyId = String(req.headers["x-company-id"] || req.query.companyId || "");
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
      const companyId = String(req.headers["x-company-id"] || req.query.companyId || "");
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
