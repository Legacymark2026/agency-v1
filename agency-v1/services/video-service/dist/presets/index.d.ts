export interface RenderPreset {
    id: string;
    name: string;
    platform: string;
    resolution: string;
    aspectRatio: string;
    fps: number;
    videoCodec: string;
    audioCodec: string;
    videoBitrate: string;
    audioBitrate: string;
    crf: number;
    preset: string;
    profile: string;
    maxDuration: number;
    safeZone: {
        top: number;
        bottom: number;
        left: number;
        right: number;
    };
    thumbnail: boolean;
    spriteSheet: boolean;
}
export declare const RENDER_PRESETS: RenderPreset[];
export declare function getPresetById(id: string): RenderPreset | undefined;
export declare function getPresetsByPlatform(platform: string): RenderPreset[];
export declare function generateFFmpegArgs(preset: RenderPreset, inputPath: string, outputPath: string): string;
export declare function getAllPresets(): RenderPreset[];
