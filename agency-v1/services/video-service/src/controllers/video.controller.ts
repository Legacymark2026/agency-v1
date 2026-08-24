import { Request, Response, NextFunction } from "express";
import { VideoService } from "../services/video.service";
import { ViralClipperService } from "../services/viral-clipper.service";
import { KineticSubtitlesService } from "../services/kinetic-subtitles.service";
import { SilenceRemoverService } from "../services/silence-remover.service";
import { AudioDuckingService } from "../services/audio-ducking.service";
import { SmartReframeService } from "../services/smart-reframe.service";
import { BrollMatcherService } from "../services/broll-matcher.service";
import { ThumbnailGeneratorService } from "../services/thumbnail-generator.service";

export class VideoController {
  /**
   * GET /api/video/projects
   */
  static async getVideoProjects(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = String(req.headers["x-company-id"] || req.query.companyId || "");
      if (!companyId) {
        return res.status(400).json({ success: false, error: "companyId is required" });
      }

      const projects = await VideoService.getVideoProjects(companyId);
      res.json({ success: true, projects });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/video/render
   */
  static async createRenderJob(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = String(req.headers["x-company-id"] || req.body.companyId || "");
      if (!companyId) {
        return res.status(400).json({ success: false, error: "companyId is required" });
      }

      const job = await VideoService.createRenderJob({
        ...req.body,
        companyId,
      });

      res.status(201).json({ success: true, job });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/video/optimize
   */
  static async optimizeVideo(req: Request, res: Response, next: NextFunction) {
    try {
      const { videoPath } = req.body;
      if (!videoPath) {
        return res.status(400).json({ success: false, error: "videoPath is required" });
      }

      const { VideoProcessorService } = await import("../services/video-processor.service.js");
      const result = await VideoProcessorService.optimizeVideoForWeb(String(videoPath));
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/video/watermark
   */
  static async applyWatermark(req: Request, res: Response, next: NextFunction) {
    try {
      const { videoPath, logoPath, position } = req.body;
      if (!videoPath || !logoPath) {
        return res.status(400).json({ success: false, error: "videoPath and logoPath are required" });
      }

      const { VideoProcessorService } = await import("../services/video-processor.service.js");
      const result = await VideoProcessorService.applyWatermark(String(videoPath), String(logoPath), position);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  /**
   * 1. POST /api/video/auto-clip (OpusClip AI Viral Highlight Cutter)
   */
  static async autoClip(req: Request, res: Response, next: NextFunction) {
    try {
      const { sentences, targetDuration } = req.body;
      const clipper = new ViralClipperService();
      const clips = clipper.extractViralClips(
        sentences || [
          { text: "El gran secreto para escalar un SaaS en 2026...", startSec: 0, endSec: 8, energyLevel: 0.9 },
          { text: "es automatizar la contabilidad con IA para ahorrar costos.", startSec: 8, endSec: 25, energyLevel: 0.85 },
        ],
        targetDuration || 30
      );
      res.json({ success: true, clips });
    } catch (err) {
      next(err);
    }
  }

  /**
   * 2. POST /api/video/kinetic-subtitles (CapCut / Submagic Karaoke Subtitles)
   */
  static async kineticSubtitles(req: Request, res: Response, next: NextFunction) {
    try {
      const { words, wordsPerBlock } = req.body;
      const service = new KineticSubtitlesService();
      const blocks = service.generateSubtitleBlocks(words || [], wordsPerBlock || 4);
      const assScript = service.exportToAssScript(blocks);
      res.json({ success: true, blocks, assScript });
    } catch (err) {
      next(err);
    }
  }

  /**
   * 3. POST /api/video/remove-silence (Descript Style Jump-Cutter)
   */
  static async removeSilence(req: Request, res: Response, next: NextFunction) {
    try {
      const { samples, thresholdDb, minSilenceDurationSec } = req.body;
      const service = new SilenceRemoverService();
      const result = service.removeSilence(samples || [], thresholdDb || -35, minSilenceDurationSec || 0.5);
      res.json({ success: true, result });
    } catch (err) {
      next(err);
    }
  }

  /**
   * 4. POST /api/video/auto-duck (Spectral Audio Ducking)
   */
  static async autoDuck(req: Request, res: Response, next: NextFunction) {
    try {
      const { voiceEvents, totalDurationSec, duckingDepthDb } = req.body;
      const service = new AudioDuckingService();
      const result = service.calculateDuckingCurve(voiceEvents || [], totalDurationSec || 60, duckingDepthDb || -18);
      res.json({ success: true, result });
    } catch (err) {
      next(err);
    }
  }

  /**
   * 5. POST /api/video/smart-reframe (AI 16:9 to 9:16 Face Tracker)
   */
  static async smartReframe(req: Request, res: Response, next: NextFunction) {
    try {
      const { faceTrackingPoints, sourceWidth, sourceHeight } = req.body;
      const service = new SmartReframeService();
      const result = service.calculateCropPath(
        faceTrackingPoints || [{ timestampSec: 0, normalizedX: 0.5, normalizedY: 0.4, confidence: 0.95 }],
        sourceWidth || 1920,
        sourceHeight || 1080
      );
      res.json({ success: true, result });
    } catch (err) {
      next(err);
    }
  }

  /**
   * 6. POST /api/video/match-broll (Contextual B-Roll Inserter)
   */
  static async matchBroll(req: Request, res: Response, next: NextFunction) {
    try {
      const { transcript, availableAssets } = req.body;
      const service = new BrollMatcherService();
      const matched = service.matchBrolls(transcript || [], availableAssets || []);
      res.json({ success: true, matched });
    } catch (err) {
      next(err);
    }
  }

  /**
   * 7. POST /api/video/generate-thumbnail (High-CTR Thumbnail Generator)
   */
  static async generateThumbnail(req: Request, res: Response, next: NextFunction) {
    try {
      const { videoTitle, candidateFrames, targetFormat } = req.body;
      const service = new ThumbnailGeneratorService();
      const design = service.generateThumbnailDesign(videoTitle || "Video Corporativo", candidateFrames || [], targetFormat || "1280x720");
      res.json({ success: true, design });
    } catch (err) {
      next(err);
    }
  }
}
