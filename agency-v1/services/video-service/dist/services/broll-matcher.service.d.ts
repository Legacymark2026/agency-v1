/**
 * AI B-Roll Inserter & Stock Video Cutaway Matcher (InVideo / Runway style)
 * ─────────────────────────────────────────────────────────────────────────────
 * Analyzes video transcript sentences, extracts visual semantic concepts,
 * and schedules B-Roll cutaway video overlays to maintain high visual engagement.
 */
export interface BrollAsset {
    id: string;
    title: string;
    category: "BUSINESS" | "FINANCE" | "TECHNOLOGY" | "TEAMWORK" | "SUCCESS" | "LIFESTYLE";
    keywords: string[];
    durationSec: number;
    assetUrl: string;
}
export interface CutawayInsertPlan {
    brollAssetId: string;
    brollTitle: string;
    category: string;
    startSec: number;
    endSec: number;
    durationSec: number;
    matchedKeyword: string;
    transitionType: "SMOOTH_DISSOLVE" | "QUICK_CUT" | "SLIDE_LEFT";
}
export declare class BrollMatcherService {
    private defaultCatalog;
    /**
     * Generates a timeline schedule of B-Roll cutaways matched to speech concepts.
     */
    matchBrollToTranscript(transcriptSegments: Array<{
        text: string;
        startSec: number;
        endSec: number;
    }>, minGapBetweenBrollsSec?: number): CutawayInsertPlan[];
}
export declare const brollMatcherService: BrollMatcherService;
