export interface CaptionWord {
    word: string;
    startTime: number;
    endTime: number;
    confidence: number;
}
export interface CaptionSegment {
    id: string;
    text: string;
    words: CaptionWord[];
    startTime: number;
    endTime: number;
    language: string;
}
export interface CaptionOptions {
    language?: string;
    maxLineLength?: number;
    maxWordsPerLine?: number;
    model?: 'base' | 'small' | 'medium' | 'large';
}
export interface CaptionResult {
    segments: CaptionSegment[];
    language: string;
    duration: number;
    wordCount: number;
}
export declare function transcribeAudio(audioPath: string, options?: CaptionOptions): Promise<CaptionResult>;
export declare function generateFallbackCaptions(audioPath: string, options?: CaptionOptions): CaptionSegment[];
export declare function exportSRT(segments: CaptionSegment[]): string;
export declare function exportVTT(segments: CaptionSegment[]): string;
export declare function exportASS(segments: CaptionSegment[]): string;
export declare function getAudioDuration(audioPath: string): Promise<number>;
export declare function extractAudioFromVideo(videoPath: string, outputPath: string): Promise<void>;
