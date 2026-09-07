/**
 * AI Script-to-Video & Storyboard Generator Service
 * ─────────────────────────────────────────────────────────────────────────────
 * Generates viral 4-act storyboards (Hook, Problem, Solution, CTA) with visual cues,
 * suggested B-Roll tags, kinetic subtitle overlays and auto-calculated timeline durations.
 */
export interface ScriptGeneratorInput {
    topic: string;
    niche?: string;
    targetDurationSec?: number;
    tone?: 'HIGH_CONVERSION' | 'INSPIRATIONAL' | 'EDUCATIONAL' | 'HUMOROUS_CONTROVERSIAL';
    language?: 'es' | 'en';
}
export interface StoryboardBeat {
    phase: 'HOOK' | 'PROBLEM' | 'SOLUTION' | 'CTA';
    startSec: number;
    durationSec: number;
    spokenNarration: string;
    visualPrompt: string;
    suggestedBrollKeyword: string;
    overlayHeadline: string;
    energyLevel: number;
}
export interface GeneratedScriptProject {
    projectId: string;
    title: string;
    targetDurationSec: number;
    wordCount: number;
    beats: StoryboardBeat[];
    recommendedAspect: '9:16' | '16:9';
    suggestedBpm: number;
}
export declare class ScriptGeneratorService {
    generateScript(input: ScriptGeneratorInput): GeneratedScriptProject;
}
export declare const scriptGeneratorService: ScriptGeneratorService;
