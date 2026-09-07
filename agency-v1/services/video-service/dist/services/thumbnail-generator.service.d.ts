/**
 * High-CTR AI Thumbnail & Punchy Headline Generator (Canva / Midjourney style)
 * ─────────────────────────────────────────────────────────────────────────────
 * Selects peak visual candidate timestamps (face clarity, sharpness, emotion),
 * and generates high-contrast, clickable headline text overlays with bold borders.
 */
export interface CandidateFrame {
    timestampSec: number;
    faceClarityScore: number;
    sharpnessScore: number;
    expressionType: "SMILING" | "EXCITED" | "SERIOUS" | "THINKING";
}
export interface ThumbnailDesignOutput {
    chosenTimestampSec: number;
    overallFrameQuality: number;
    punchyHeadline: string;
    badgeTag: string;
    recommendedResolution: "1280x720" | "1080x1920";
    ffmpegThumbnailCommand: string;
}
export declare class ThumbnailGeneratorService {
    /**
     * Evaluates candidate frames and designs an eye-catching thumbnail layout.
     */
    generateThumbnailDesign(videoTitle: string, candidates: CandidateFrame[], targetFormat?: "1280x720" | "1080x1920"): ThumbnailDesignOutput;
}
export declare const thumbnailGeneratorService: ThumbnailGeneratorService;
