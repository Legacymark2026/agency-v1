import { type AudioEffectPreset, type TTSEngine, type ParalinguisticTag } from '@agency/voicebox';
import type { AudioTrack } from '../index.js';
export interface ScriptNarrativeBlock {
    id: string;
    text: string;
    voiceProfileId?: string;
    engine?: TTSEngine;
    emotion?: ParalinguisticTag;
    effectsPreset?: AudioEffectPreset;
    startTimeSeconds?: number;
}
export interface NarrationResult {
    totalDurationSeconds: number;
    tracks: AudioTrack[];
    scriptBlocks: ScriptNarrativeBlock[];
}
export declare class VoiceNarrator {
    private client;
    constructor(clientUrl?: string);
    /**
     * Automatically splits a video script into blocks, synthesizes audio using Voicebox TTS,
     * and builds AudioTrack objects compatible with VideoEditorModule timeline.
     */
    generateNarrationForScript(blocks: ScriptNarrativeBlock[], defaultVoiceProfileId?: string): Promise<NarrationResult>;
}
