import { Request, Response, NextFunction } from "express";
export declare class VideoController {
    /**
     * GET /api/video/projects
     */
    static getVideoProjects(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * POST /api/video/render
     */
    static createRenderJob(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * POST /api/video/optimize
     */
    static optimizeVideo(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * POST /api/video/watermark
     */
    static applyWatermark(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * 1. POST /api/video/auto-clip (OpusClip AI Viral Highlight Cutter)
     */
    static autoClip(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * 2. POST /api/video/kinetic-subtitles (CapCut / Submagic Karaoke Subtitles)
     */
    static kineticSubtitles(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * 3. POST /api/video/remove-silence (Descript Style Jump-Cutter)
     */
    static removeSilence(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * 4. POST /api/video/auto-duck (Spectral Audio Ducking)
     */
    static autoDuck(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * 5. POST /api/video/smart-reframe (AI 16:9 to 9:16 Reframe)
     */
    static smartReframe(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * 6. POST /api/video/match-broll (Contextual B-Roll Inserter)
     */
    static matchBroll(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * 7. POST /api/video/generate-thumbnail (High-CTR Thumbnail Generator)
     */
    static generateThumbnail(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * 8. POST /api/video/enhance-audio (AI Noise Isolation & Speech Enhance)
     */
    static enhanceAudio(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * 9. POST /api/video/voiceover (AI Voiceover & Emotion TTS Narrator)
     */
    static voiceover(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * 10. POST /api/video/script-to-video (AI Script & Storyboard Generator)
     */
    static generateScript(req: Request, res: Response, next: NextFunction): Promise<void>;
}
