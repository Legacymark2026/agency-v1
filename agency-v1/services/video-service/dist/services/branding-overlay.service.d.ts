/**
 * Lower-Thirds Branding & Animated Watermark Overlay Engine
 * ─────────────────────────────────────────────────────────────────────────────
 * Generates broadcast-grade animated lower-third title overlays (Speaker, Title,
 * Handle) and corner brand watermarks with smooth fade-in/fade-out transitions.
 */
export interface LowerThirdConfig {
    speakerName: string;
    speakerRole: string;
    socialHandle?: string;
    startSec: number;
    durationSec: number;
    themeColor: "EMERALD_NEON" | "CYAN_TECH" | "GOLD_LUXURY" | "MONOCHROME_DARK";
}
export interface WatermarkConfig {
    logoUrl: string;
    position: "TOP_RIGHT" | "TOP_LEFT" | "BOTTOM_RIGHT" | "BOTTOM_LEFT";
    opacity: number;
    scalePercent: number;
}
export interface BrandingFilterResult {
    ffmpegDrawtextFilter: string;
    ffmpegOverlayFilter: string;
    totalElementsCount: number;
    previewDescription: string;
}
export declare class BrandingOverlayService {
    /**
     * Generates FFmpeg complex filters for lower-third and logo watermarks.
     */
    generateBrandingFilters(lowerThird: LowerThirdConfig, watermark?: WatermarkConfig): BrandingFilterResult;
}
export declare const brandingOverlayService: BrandingOverlayService;
