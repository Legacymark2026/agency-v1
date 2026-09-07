/**
 * AI Voice Isolation & Broadcast Audio Enhancement Service
 * ─────────────────────────────────────────────────────────────────────────────
 * Generates advanced FFmpeg audio filtering graphs for studio-quality vocal clarity:
 * - FFT-based dynamic noise suppression (afftdn)
 * - Vocal bandpass frequency shaping (80Hz - 12kHz)
 * - Vocal dynamics compressor for consistent speech level
 * - Broadcast standard loudness normalization (EBU R128 / ITU-R BS.1770-4)
 */
export interface VoiceIsolationInput {
    inputAudioPath?: string;
    aggressiveness?: 'LIGHT' | 'MODERATE' | 'AGGRESSIVE';
    targetLufs?: number;
    deEsser?: boolean;
    deReverb?: boolean;
}
export interface VoiceIsolationResult {
    isolationId: string;
    appliedFilters: string[];
    ffmpegAudioFilterComplex: string;
    targetLufs: number;
    noiseFloorReductionDb: number;
    speechClarityBoostPercent: number;
    simulatedOutputAudioUrl: string;
}
export declare class VoiceIsolationService {
    enhanceVoice(input: VoiceIsolationInput): VoiceIsolationResult;
}
export declare const voiceIsolationService: VoiceIsolationService;
