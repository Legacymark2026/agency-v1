/**
 * Kinetic Animated Karaoke Subtitles & Emoji Highlighter (CapCut / Submagic style)
 * ─────────────────────────────────────────────────────────────────────────────
 * Generates dynamic, word-by-word synchronized subtitles with active word highlighting,
 * automatic contextual emoji injection, and ASS/VTT/SRT format outputs.
 */
export interface TimedWord {
    word: string;
    startSec: number;
    endSec: number;
}
export interface SubtitleBlock {
    words: TimedWord[];
    startSec: number;
    endSec: number;
    text: string;
    emoji?: string;
}
export declare class KineticSubtitlesService {
    private emojiMap;
    /**
     * Enriches timed words into dynamic subtitle blocks with emojis.
     */
    generateSubtitleBlocks(words: TimedWord[], wordsPerBlock?: number): SubtitleBlock[];
    /**
     * Generates Advanced SubStation Alpha (ASS) format for FFmpeg hardcoded karaoke rendering.
     */
    generateASSFormat(blocks: SubtitleBlock[]): string;
    private formatASSTime;
}
export declare const kineticSubtitlesService: KineticSubtitlesService;
