export interface LUTConfig {
    lutPath: string;
    intensity: number;
    format: 'cube' | '3dl' | 'look';
}
export interface ColorGradePreset {
    name: string;
    description: string;
    lutFile: string;
    intensity: number;
    category: 'cinematic' | 'documentary' | 'vintage' | 'modern' | 'dramatic';
}
export declare const LUT_PRESETS: ColorGradePreset[];
export declare function applyLUT(inputPath: string, outputPath: string, lutConfig: LUTConfig): Promise<boolean>;
export declare function applyColorGrade(inputPath: string, outputPath: string, presetName: string, intensity?: number): Promise<boolean>;
export declare function getLUTPresets(): ColorGradePreset[];
export declare function getLUTPresetsByCategory(category: string): ColorGradePreset[];
