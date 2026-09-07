import { Request, Response, NextFunction } from "express";
import { VideoService } from "../services/video.service.js";
import { ViralClipperService } from "../services/viral-clipper.service.js";
import { KineticSubtitlesService } from "../services/kinetic-subtitles.service.js";
import { SilenceRemoverService } from "../services/silence-remover.service.js";
import { AudioDuckingService } from "../services/audio-ducking.service.js";
import { SmartReframeService } from "../services/smart-reframe.service.js";
import { BrollMatcherService } from "../services/broll-matcher.service.js";
import { ThumbnailGeneratorService } from "../services/thumbnail-generator.service.js";
import { VoiceIsolationService } from "../services/voice-isolation.service.js";
import { VoiceoverNarratorService } from "../services/voiceover-narrator.service.js";
import { ScriptGeneratorService } from "../services/script-generator.service.js";

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
      const assScript = service.generateASSFormat(blocks);
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
      const { speechSegments, totalDurationSec, duckedLevel, normalLevel } = req.body;
      const service = new AudioDuckingService();
      const result = service.generateDuckingCurve(
        speechSegments || [{ startSec: 2, endSec: 15 }],
        totalDurationSec || 60,
        duckedLevel || 0.15,
        normalLevel || 0.8
      );
      res.json({ success: true, result });
    } catch (err) {
      next(err);
    }
  }

  /**
   * 5. POST /api/video/smart-reframe (AI 16:9 to 9:16 Reframe)
   */
  static async smartReframe(req: Request, res: Response, next: NextFunction) {
    try {
      const { targetRatio, fitMode, sourceWidth, sourceHeight } = req.body;
      const service = new SmartReframeService();
      const result = service.computeReframeFilter({
        targetRatio: targetRatio || "9:16",
        fitMode: fitMode || "SMART_CENTER_CROP",
        sourceWidth: sourceWidth || 1920,
        sourceHeight: sourceHeight || 1080,
      });
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
      const { transcriptSegments, minGapBetweenBrollsSec } = req.body;
      const service = new BrollMatcherService();
      const matched = service.matchBrollToTranscript(
        transcriptSegments || [
          { text: "nuestro software contable con inteligencia artificial", startSec: 2, endSec: 8 },
        ],
        minGapBetweenBrollsSec || 4
      );
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
      const { videoTitle, candidates, targetFormat } = req.body;
      const service = new ThumbnailGeneratorService();
      const design = service.generateThumbnailDesign(
        videoTitle || "Video Corporativo",
        candidates || [],
        targetFormat || "1280x720"
      );
      res.json({ success: true, design });
    } catch (err) {
      next(err);
    }
  }

  /**
   * 8. POST /api/video/enhance-audio (AI Noise Isolation & Speech Enhance)
   */
  static async enhanceAudio(req: Request, res: Response, next: NextFunction) {
    try {
      const { inputAudioPath, aggressiveness, targetLufs, deEsser, deReverb } = req.body;
      const service = new VoiceIsolationService();
      const result = service.enhanceVoice({
        inputAudioPath,
        aggressiveness,
        targetLufs,
        deEsser,
        deReverb,
      });
      res.json({ success: true, result });
    } catch (err) {
      next(err);
    }
  }

  /**
   * 9. POST /api/video/voiceover (AI Voiceover & Emotion TTS Narrator)
   */
  static async voiceover(req: Request, res: Response, next: NextFunction) {
    try {
      const { scriptText, voiceId, language, emotion, speedRate, pitchModulation } = req.body;
      const service = new VoiceoverNarratorService();
      const track = service.synthesizeVoiceover({
        scriptText: scriptText || "Transforma tu negocio con inteligencia artificial.",
        voiceId: voiceId || "cloned_voice_co_1",
        language: language || "es-CO",
        emotion: emotion || "CORPORATE_PROFESSIONAL",
        speedRate: speedRate || 1.0,
        pitchModulation: pitchModulation || 0,
      });
      res.json({ success: true, track });
    } catch (err) {
      next(err);
    }
  }

  /**
   * 10. POST /api/video/script-to-video (AI Script & Storyboard Generator)
   */
  static async generateScript(req: Request, res: Response, next: NextFunction) {
    try {
      const { topic, niche, targetDurationSec, tone, language } = req.body;
      const service = new ScriptGeneratorService();
      const project = service.generateScript({
        topic: topic || "Automatización con IA para Empresas",
        niche: niche || "B2B SaaS",
        targetDurationSec: targetDurationSec || 30,
        tone: tone || "HIGH_CONVERSION",
        language: language || "es",
      });
      res.json({ success: true, project });
    } catch (err) {
      next(err);
    }
  }
}
