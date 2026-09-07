/**
 * AI Viral Highlight & Retention Hook Clipper (OpusClip / Klap style)
 * ─────────────────────────────────────────────────────────────────────────────
 * Analyzes video transcript, audio energy levels, and narrative hook triggers
 * to automatically extract 15s, 30s, and 60s viral short-form clips with virality scores.
 */
export interface TranscriptSentence {
    text: string;
    startSec: number;
    endSec: number;
    energyLevel: number;
}
export interface ViralClipResult {
    clipId: string;
    title: string;
    startSec: number;
    endSec: number;
    durationSec: number;
    viralityScore: number;
    hookHeadline: string;
    recommendedPlatform: "TIKTOK" | "INSTAGRAM_REELS" | "YOUTUBE_SHORTS";
}
export declare class ViralClipperService {
    private hookKeywords;
    /**
     * Extracts viral highlight clips from a full video transcript and energy profile.
     * Supports transcripts up to 60+ minutes (3600s).
     */
    extractViralClips(sentences: TranscriptSentence[], targetDuration?: number, maxClips?: number): ViralClipResult[];
}
export declare const viralClipperService: ViralClipperService;
