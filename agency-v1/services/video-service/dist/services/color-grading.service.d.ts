/**
 * Cinematic LUT & Auto Color Grading Enhancer (DaVinci / Premiere style)
 * ─────────────────────────────────────────────────────────────────────────────
 * Applies filmic color grading profiles, contrast enhancement, dynamic range expansion,
 * and saturation balancing using standard FFmpeg color balance & curves matrices.
 */
export type ColorPreset = "TEAL_AND_ORANGE" | "MOODY_CINEMATIC" | "COMMERCIAL_VIBRANT" | "CLEAN_MINIMAL";
export interface ColorGradingConfig {
    preset: ColorPreset;
    intensity: number;
    exposureBoost?: number;
}
export interface ColorGradingResult {
    preset: ColorPreset;
    ffmpegEqFilter: string;
    description: string;
}
export declare class ColorGradingService {
    /**
     * Generates FFmpeg eq & colorbalance filter string for cinematic look.
     */
    generateColorFilter(config: ColorGradingConfig): ColorGradingResult;
}
export declare const colorGradingService: ColorGradingService;
