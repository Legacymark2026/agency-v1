/**
 * Multi-Aspect Ratio Smart Cropper with Gaussian Blur Backdrop
 * ─────────────────────────────────────────────────────────────────────────────
 * Intelligently transforms 16:9 widescreen video into 9:16 vertical shorts,
 * 1:1 square, or 4:5 social feeds with automatic center face framing and blurred letterboxing.
 */
export type TargetAspectRatio = "9:16" | "1:1" | "4:5" | "16:9";
export interface ReframeConfig {
    targetRatio: TargetAspectRatio;
    fitMode: "SMART_CENTER_CROP" | "BLURRED_BACKDROP_LETTERBOX";
    sourceWidth: number;
    sourceHeight: number;
}
export interface ReframeFilterResult {
    targetWidth: number;
    targetHeight: number;
    aspectRatio: TargetAspectRatio;
    ffmpegFilterComplex: string;
    recommendedResolution: string;
}
export declare class SmartReframeService {
    /**
     * Computes optimal FFmpeg filter complex for target social aspect ratio.
     */
    computeReframeFilter(config: ReframeConfig): ReframeFilterResult;
}
export declare const smartReframeService: SmartReframeService;
