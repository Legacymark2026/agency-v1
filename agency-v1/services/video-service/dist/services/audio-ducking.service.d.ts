/**
 * Automatic Voiceover Audio Ducking & Sidechain Compression Engine
 * ─────────────────────────────────────────────────────────────────────────────
 * Dynamically attenuates background music when voiceover is detected
 * and restores background audio during speech pauses with smooth volume envelopes.
 */
export interface SpeechSegment {
    startSec: number;
    endSec: number;
}
export interface VolumePoint {
    timeSec: number;
    volumeMultiplier: number;
}
export interface AudioDuckingCurveResult {
    duckedVolumeMultiplier: number;
    normalVolumeMultiplier: number;
    attackMs: number;
    releaseMs: number;
    volumePoints: VolumePoint[];
    ffmpegAFilter: string;
}
export declare class AudioDuckingService {
    /**
     * Generates dynamic audio volume envelope points and FFmpeg aevalsrc/volume filter.
     */
    generateDuckingCurve(speechSegments: SpeechSegment[], totalDurationSec: number, duckedLevel?: number, // -16.5 dB
    normalLevel?: number, // -1.9 dB
    attackMs?: number, releaseMs?: number): AudioDuckingCurveResult;
}
export declare const audioDuckingService: AudioDuckingService;
