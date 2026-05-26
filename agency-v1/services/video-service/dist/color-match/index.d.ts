export interface ColorAdjustments {
    brightness?: number;
    contrast?: number;
    saturation?: number;
    temperature?: number;
    tint?: number;
    highlights?: number;
    shadows?: number;
    exposure?: number;
    vibrance?: number;
    gamma?: number;
}
export interface ColorMatchSuggestion {
    id: string;
    sourceClip: string;
    targetClip: string;
    adjustments: ColorAdjustments;
    confidence: number;
    reason: string;
    histograms?: {
        source: ColorHistogram;
        target: ColorHistogram;
        matched: ColorHistogram;
    };
}
export interface ColorHistogram {
    r: number[];
    g: number[];
    b: number[];
    luminance: number[];
    dominantColors: string[];
    averageRGB: [number, number, number];
    averageHSL: [number, number, number];
}
export interface ColorMatchOptions {
    tolerance?: number;
    preserveSkinTones?: boolean;
    matchLuminance?: boolean;
    matchSaturation?: boolean;
    matchTemperature?: boolean;
    targetLuminance?: number;
}
export interface LUTData {
    name: string;
    data: number[][][];
    description: string;
}
export declare function extractHistogram(imagePath: string, bins?: number): ColorHistogram;
export declare function suggestColorMatch(sourceImg: string, targetImg: string, sourceId: string, targetId: string, options?: ColorMatchOptions): ColorMatchSuggestion;
export declare function generateColorMatchFFmpegFilter(adjustments: ColorAdjustments): string;
export declare function batchColorMatch(clips: Array<{
    id: string;
    path: string;
}>, referenceId: string, options?: ColorMatchOptions): ColorMatchSuggestion[];
export declare function createLUT3D(adjustments: ColorAdjustments, size?: number): LUTData;
export declare function getDefaultLUTs(): LUTData[];
