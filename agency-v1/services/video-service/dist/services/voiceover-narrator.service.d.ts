/**
 * AI Voiceover & Emotion TTS Narrator (ElevenLabs / Voicebox style)
 * ─────────────────────────────────────────────────────────────────────────────
 * Synthesizes ultra-natural, emotionally modulated speech audio from text scripts
 * in Spanish and English with precise word-level duration forecasting.
 */
export type VoiceEmotion = "CORPORATE_PROFESSIONAL" | "HIGH_ENERGY_ENTHUSIASTIC" | "CALM_NARRATIVE" | "DRAMATIC_URGENT";
export type VoiceLanguage = "es-CO" | "es-MX" | "es-ES" | "en-US";
export interface VoiceoverScriptInput {
    scriptText: string;
    voiceId: string;
    language: VoiceLanguage;
    emotion: VoiceEmotion;
    speedRate?: number;
    pitchModulation?: number;
}
export interface GeneratedVoiceoverTrack {
    trackId: string;
    totalDurationSec: number;
    wordCount: number;
    averageWpm: number;
    emotionApplied: VoiceEmotion;
    audioFormat: "audio/mp3" | "audio/wav";
    sampleRateHz: number;
    simulatedAudioBufferLength: number;
}
export declare class VoiceoverNarratorService {
    /**
     * Synthesizes audio track metadata and duration from input script.
     */
    synthesizeVoiceover(input: VoiceoverScriptInput): GeneratedVoiceoverTrack;
}
export declare const voiceoverNarratorService: VoiceoverNarratorService;
