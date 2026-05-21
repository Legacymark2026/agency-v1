export interface AudioWord {
    word: string;
    start: number;
    end: number;
    confidence: number;
}
export interface AudioAnalysis {
    words: AudioWord[];
    duration: number;
    silenceSegments: {
        start: number;
        end: number;
        duration: number;
    }[];
    language: string;
    energy: number[];
    loudnessLUFS: number;
}
export declare function analyzeAudioTrack(audioUrl: string, options?: {
    apiKey?: string;
    language?: string;
}): Promise<AudioAnalysis>;
