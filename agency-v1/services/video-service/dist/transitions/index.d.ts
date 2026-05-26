export type TransitionType = 'dissolve' | 'fade' | 'wipe' | 'slide' | 'zoom' | 'glitch' | 'morph' | 'lightLeak';
export interface TransitionSuggestion {
    id: string;
    type: TransitionType;
    fromClip: string;
    toClip: string;
    fromMetadata?: ClipMetadata;
    toMetadata?: ClipMetadata;
    confidence: number;
    reason: string;
    duration: number;
    parameters?: Record<string, any>;
}
export interface TransitionPreset {
    id: string;
    name: string;
    type: TransitionType;
    description: string;
    defaultDuration: number;
    tags: string[];
    complexity: 'simple' | 'moderate' | 'complex';
    parameters: Record<string, any>;
}
export interface ClipMetadata {
    id: string;
    duration: number;
    averageLuminance?: number;
    dominantColors?: string[];
    motionIntensity?: number;
    audioLevel?: number;
    scene?: string;
    hasFace?: boolean;
    textOverlay?: boolean;
}
export interface TransitionOptions {
    preferredTypes?: TransitionType[];
    maxDuration?: number;
    minConfidence?: number;
    style?: 'cinematic' | 'dynamic' | 'minimal' | 'vintage';
}
export declare function getAllTransitionPresets(): TransitionPreset[];
export declare function getTransitionPresetById(id: string): TransitionPreset | undefined;
export declare function getTransitionsByComplexity(complexity: TransitionPreset['complexity']): TransitionPreset[];
export declare function suggestTransition(fromClip: ClipMetadata, toClip: ClipMetadata, options?: TransitionOptions): TransitionSuggestion[];
export declare function autoSuggestAllTransitions(clips: ClipMetadata[], options?: TransitionOptions): TransitionSuggestion[];
export declare function analyzeClipForTransition(clipPath: string, clipId: string): Promise<ClipMetadata>;
export declare function getTransitionFFmpegFilter(type: TransitionType, duration: number, parameters?: Record<string, any>): string;
