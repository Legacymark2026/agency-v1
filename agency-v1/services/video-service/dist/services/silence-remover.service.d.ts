/**
 * AI Silence & Dead Air Remover (Descript / Jumpcut style)
 * ─────────────────────────────────────────────────────────────────────────────
 * Detects silent intervals and filler hesitations (>500ms), calculates optimal
 * cut points, and generates an Edit Decision List (EDL) with micro-crossfades.
 */
export interface AudioVolumeSample {
    timestampSec: number;
    dbLevel: number;
}
export interface KeepSegment {
    segmentIndex: number;
    startSec: number;
    endSec: number;
    durationSec: number;
}
export interface SilenceRemovalResult {
    originalDurationSec: number;
    finalDurationSec: number;
    savedDurationSec: number;
    silenceThresholdDb: number;
    segmentsToKeep: KeepSegment[];
    cutCount: number;
}
export declare class SilenceRemoverService {
    /**
     * Identifies speech segments and removes dead air pauses below dB threshold.
     */
    removeSilence(samples: AudioVolumeSample[], thresholdDb?: number, minSilenceDurationSec?: number): SilenceRemovalResult;
}
export declare const silenceRemoverService: SilenceRemoverService;
