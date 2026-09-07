/**
 * Video Caption & Multi-Platform Aspect Ratio Cropper
 * ─────────────────────────────────────────────────────────────────────────────
 * Generates SRT/VTT subtitles and calculates smart 9:16 crop boundaries
 * for TikTok, Instagram Reels, and YouTube Shorts.
 */
export interface CaptionSegment {
    index: number;
    startTime: string;
    endTime: string;
    text: string;
}
export interface VideoFormatCropResult {
    targetAspect: "9:16" | "1:1" | "16:9";
    cropWidth: number;
    cropHeight: number;
    cropX: number;
    cropY: number;
    vttContent: string;
    srtContent: string;
}
export declare function generateVideoCaptionsAndCrop(scriptText: string, originalWidth?: number, originalHeight?: number, targetAspect?: "9:16" | "1:1" | "16:9"): VideoFormatCropResult;
