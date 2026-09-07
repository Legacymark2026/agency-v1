"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.VideoController = void 0;
const video_service_js_1 = require("../services/video.service.js");
const viral_clipper_service_js_1 = require("../services/viral-clipper.service.js");
const kinetic_subtitles_service_js_1 = require("../services/kinetic-subtitles.service.js");
const silence_remover_service_js_1 = require("../services/silence-remover.service.js");
const audio_ducking_service_js_1 = require("../services/audio-ducking.service.js");
const smart_reframe_service_js_1 = require("../services/smart-reframe.service.js");
const broll_matcher_service_js_1 = require("../services/broll-matcher.service.js");
const thumbnail_generator_service_js_1 = require("../services/thumbnail-generator.service.js");
const voice_isolation_service_js_1 = require("../services/voice-isolation.service.js");
const voiceover_narrator_service_js_1 = require("../services/voiceover-narrator.service.js");
const script_generator_service_js_1 = require("../services/script-generator.service.js");
class VideoController {
    /**
     * GET /api/video/projects
     */
    static async getVideoProjects(req, res, next) {
        try {
            const companyId = String(req.headers["x-company-id"] || req.query.companyId || "");
            if (!companyId) {
                return res.status(400).json({ success: false, error: "companyId is required" });
            }
            const projects = await video_service_js_1.VideoService.getVideoProjects(companyId);
            res.json({ success: true, projects });
        }
        catch (err) {
            next(err);
        }
    }
    /**
     * POST /api/video/render
     */
    static async createRenderJob(req, res, next) {
        try {
            const companyId = String(req.headers["x-company-id"] || req.body.companyId || "");
            if (!companyId) {
                return res.status(400).json({ success: false, error: "companyId is required" });
            }
            const job = await video_service_js_1.VideoService.createRenderJob({
                ...req.body,
                companyId,
            });
            res.status(201).json({ success: true, job });
        }
        catch (err) {
            next(err);
        }
    }
    /**
     * POST /api/video/optimize
     */
    static async optimizeVideo(req, res, next) {
        try {
            const { videoPath } = req.body;
            if (!videoPath) {
                return res.status(400).json({ success: false, error: "videoPath is required" });
            }
            const { VideoProcessorService } = await Promise.resolve().then(() => __importStar(require("../services/video-processor.service.js")));
            const result = await VideoProcessorService.optimizeVideoForWeb(String(videoPath));
            res.json({ success: true, data: result });
        }
        catch (err) {
            next(err);
        }
    }
    /**
     * POST /api/video/watermark
     */
    static async applyWatermark(req, res, next) {
        try {
            const { videoPath, logoPath, position } = req.body;
            if (!videoPath || !logoPath) {
                return res.status(400).json({ success: false, error: "videoPath and logoPath are required" });
            }
            const { VideoProcessorService } = await Promise.resolve().then(() => __importStar(require("../services/video-processor.service.js")));
            const result = await VideoProcessorService.applyWatermark(String(videoPath), String(logoPath), position);
            res.json({ success: true, data: result });
        }
        catch (err) {
            next(err);
        }
    }
    /**
     * 1. POST /api/video/auto-clip (OpusClip AI Viral Highlight Cutter)
     */
    static async autoClip(req, res, next) {
        try {
            const { sentences, targetDuration } = req.body;
            const clipper = new viral_clipper_service_js_1.ViralClipperService();
            const clips = clipper.extractViralClips(sentences || [
                { text: "El gran secreto para escalar un SaaS en 2026...", startSec: 0, endSec: 8, energyLevel: 0.9 },
                { text: "es automatizar la contabilidad con IA para ahorrar costos.", startSec: 8, endSec: 25, energyLevel: 0.85 },
            ], targetDuration || 30);
            res.json({ success: true, clips });
        }
        catch (err) {
            next(err);
        }
    }
    /**
     * 2. POST /api/video/kinetic-subtitles (CapCut / Submagic Karaoke Subtitles)
     */
    static async kineticSubtitles(req, res, next) {
        try {
            const { words, wordsPerBlock } = req.body;
            const service = new kinetic_subtitles_service_js_1.KineticSubtitlesService();
            const blocks = service.generateSubtitleBlocks(words || [], wordsPerBlock || 4);
            const assScript = service.generateASSFormat(blocks);
            res.json({ success: true, blocks, assScript });
        }
        catch (err) {
            next(err);
        }
    }
    /**
     * 3. POST /api/video/remove-silence (Descript Style Jump-Cutter)
     */
    static async removeSilence(req, res, next) {
        try {
            const { samples, thresholdDb, minSilenceDurationSec } = req.body;
            const service = new silence_remover_service_js_1.SilenceRemoverService();
            const result = service.removeSilence(samples || [], thresholdDb || -35, minSilenceDurationSec || 0.5);
            res.json({ success: true, result });
        }
        catch (err) {
            next(err);
        }
    }
    /**
     * 4. POST /api/video/auto-duck (Spectral Audio Ducking)
     */
    static async autoDuck(req, res, next) {
        try {
            const { speechSegments, totalDurationSec, duckedLevel, normalLevel } = req.body;
            const service = new audio_ducking_service_js_1.AudioDuckingService();
            const result = service.generateDuckingCurve(speechSegments || [{ startSec: 2, endSec: 15 }], totalDurationSec || 60, duckedLevel || 0.15, normalLevel || 0.8);
            res.json({ success: true, result });
        }
        catch (err) {
            next(err);
        }
    }
    /**
     * 5. POST /api/video/smart-reframe (AI 16:9 to 9:16 Reframe)
     */
    static async smartReframe(req, res, next) {
        try {
            const { targetRatio, fitMode, sourceWidth, sourceHeight } = req.body;
            const service = new smart_reframe_service_js_1.SmartReframeService();
            const result = service.computeReframeFilter({
                targetRatio: targetRatio || "9:16",
                fitMode: fitMode || "SMART_CENTER_CROP",
                sourceWidth: sourceWidth || 1920,
                sourceHeight: sourceHeight || 1080,
            });
            res.json({ success: true, result });
        }
        catch (err) {
            next(err);
        }
    }
    /**
     * 6. POST /api/video/match-broll (Contextual B-Roll Inserter)
     */
    static async matchBroll(req, res, next) {
        try {
            const { transcriptSegments, minGapBetweenBrollsSec } = req.body;
            const service = new broll_matcher_service_js_1.BrollMatcherService();
            const matched = service.matchBrollToTranscript(transcriptSegments || [
                { text: "nuestro software contable con inteligencia artificial", startSec: 2, endSec: 8 },
            ], minGapBetweenBrollsSec || 4);
            res.json({ success: true, matched });
        }
        catch (err) {
            next(err);
        }
    }
    /**
     * 7. POST /api/video/generate-thumbnail (High-CTR Thumbnail Generator)
     */
    static async generateThumbnail(req, res, next) {
        try {
            const { videoTitle, candidates, targetFormat } = req.body;
            const service = new thumbnail_generator_service_js_1.ThumbnailGeneratorService();
            const design = service.generateThumbnailDesign(videoTitle || "Video Corporativo", candidates || [], targetFormat || "1280x720");
            res.json({ success: true, design });
        }
        catch (err) {
            next(err);
        }
    }
    /**
     * 8. POST /api/video/enhance-audio (AI Noise Isolation & Speech Enhance)
     */
    static async enhanceAudio(req, res, next) {
        try {
            const { inputAudioPath, aggressiveness, targetLufs, deEsser, deReverb } = req.body;
            const service = new voice_isolation_service_js_1.VoiceIsolationService();
            const result = service.enhanceVoice({
                inputAudioPath,
                aggressiveness,
                targetLufs,
                deEsser,
                deReverb,
            });
            res.json({ success: true, result });
        }
        catch (err) {
            next(err);
        }
    }
    /**
     * 9. POST /api/video/voiceover (AI Voiceover & Emotion TTS Narrator)
     */
    static async voiceover(req, res, next) {
        try {
            const { scriptText, voiceId, language, emotion, speedRate, pitchModulation } = req.body;
            const service = new voiceover_narrator_service_js_1.VoiceoverNarratorService();
            const track = service.synthesizeVoiceover({
                scriptText: scriptText || "Transforma tu negocio con inteligencia artificial.",
                voiceId: voiceId || "cloned_voice_co_1",
                language: language || "es-CO",
                emotion: emotion || "CORPORATE_PROFESSIONAL",
                speedRate: speedRate || 1.0,
                pitchModulation: pitchModulation || 0,
            });
            res.json({ success: true, track });
        }
        catch (err) {
            next(err);
        }
    }
    /**
     * 10. POST /api/video/script-to-video (AI Script & Storyboard Generator)
     */
    static async generateScript(req, res, next) {
        try {
            const { topic, niche, targetDurationSec, tone, language } = req.body;
            const service = new script_generator_service_js_1.ScriptGeneratorService();
            const project = service.generateScript({
                topic: topic || "Automatización con IA para Empresas",
                niche: niche || "B2B SaaS",
                targetDurationSec: targetDurationSec || 30,
                tone: tone || "HIGH_CONVERSION",
                language: language || "es",
            });
            res.json({ success: true, project });
        }
        catch (err) {
            next(err);
        }
    }
}
exports.VideoController = VideoController;
//# sourceMappingURL=video.controller.js.map