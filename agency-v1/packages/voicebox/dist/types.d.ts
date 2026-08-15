export type TTSEngine = 'qwen3' | 'qwen_custom' | 'luxtts' | 'chatterbox_multilingual' | 'chatterbox_turbo' | 'hume_tada' | 'kokoro';
export type AudioEffectPreset = 'robotic' | 'radio' | 'echo_chamber' | 'deep_voice' | 'studio_clean';
export type ParalinguisticTag = '[laugh]' | '[sigh]' | '[gasp]' | '[chuckle]' | '[cough]' | '[groan]' | '[sniff]' | '[shush]' | '[clear throat]';
export interface PedalboardEffects {
    pitchShiftSemitones?: number;
    reverbRoomSize?: number;
    delayMs?: number;
    compressorThresholdDb?: number;
    preset?: AudioEffectPreset;
}
export interface SpeakOptions {
    text: string;
    profileId?: string;
    profileName?: string;
    engine?: TTSEngine;
    language?: string;
    emotionTags?: ParalinguisticTag[];
    pitch?: number;
    speed?: number;
    effects?: PedalboardEffects;
    chunkLimit?: number;
    crossfadeMs?: number;
}
export interface AudioResponse {
    success: boolean;
    audioUrl: string;
    audioBuffer?: Buffer;
    durationMs: number;
    format: 'mp3' | 'wav';
    charCount: number;
    engineUsed: TTSEngine;
    effectsApplied: string[];
}
export interface TranscribeOptions {
    language?: string;
    fillerWordCleanup?: boolean;
    selfCorrectionRemoval?: boolean;
    technicalTermPreservation?: boolean;
    whisperModel?: 'tiny' | 'base' | 'small' | 'medium' | 'large-v3';
}
export interface TranscribeSegment {
    start: number;
    end: number;
    text: string;
}
export interface TranscriptionResult {
    text: string;
    rawTranscript: string;
    durationSeconds: number;
    languageDetected: string;
    segments: TranscribeSegment[];
    refined: boolean;
}
export interface VoiceProfileMeta {
    organizationId: string;
    name: string;
    description?: string;
    language?: string;
    defaultEngine?: TTSEngine;
    defaultEffects?: PedalboardEffects;
}
export interface VoiceProfile extends VoiceProfileMeta {
    id: string;
    sampleUrl: string;
    createdAt: string;
    updatedAt: string;
}
export interface VoiceboxConfig {
    baseUrl: string;
    apiKey?: string;
    timeoutMs?: number;
}
//# sourceMappingURL=types.d.ts.map