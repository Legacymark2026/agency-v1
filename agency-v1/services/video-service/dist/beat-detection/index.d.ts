export interface BeatMarker {
    time: number;
    strength: number;
    frequency: number;
    barPosition?: number;
}
export interface BeatDetectionResult {
    beats: BeatMarker[];
    bpm: number;
    totalBeats: number;
    duration: number;
    confidence: number;
    analysis: {
        meanFrequency: number;
        peakFrequency: number;
        tempoStability: number;
        bars: number;
    };
}
export interface BeatDetectionOptions {
    minBpm?: number;
    maxBpm?: number;
    sensitivity?: number;
    windowSize?: number;
}
export declare function detectBeats(audioPath: string, options?: BeatDetectionOptions): Promise<BeatDetectionResult>;
export declare function getBeatTimes(beats: BeatMarker[]): number[];
export declare function getStrongBeats(beats: BeatMarker[], threshold?: number): BeatMarker[];
export declare function getBeatsInRange(beats: BeatMarker[], startTime: number, endTime: number): BeatMarker[];
export declare function snapToNearestBeat(time: number, beats: BeatMarker[]): number;
export declare function generateCutPoints(beats: BeatMarker[], intervalBeats?: number): number[];
