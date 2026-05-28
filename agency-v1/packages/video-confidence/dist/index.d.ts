export interface ConfidenceFactor {
    name: string;
    weight: number;
    score: number;
    reason: string;
}
export interface ConfidenceResult {
    overall: number;
    factors: ConfidenceFactor[];
    breakdown: ConfidenceBreakdown;
    recommendation: 'accept' | 'review' | 'reject';
    metadata?: Record<string, any>;
}
export interface ConfidenceBreakdown {
    historicalAccuracy: number;
    contextSimilarity: number;
    complexityScore: number;
    riskScore: number;
    userAffinity: number;
    temporalRelevance: number;
}
export interface HistoricalRecord {
    actionType: string;
    suggested: Record<string, any>;
    accepted: boolean;
    userModified?: Record<string, any>;
    timestamp: number;
    context?: Record<string, any>;
}
export interface ConfidenceOptions {
    minThreshold?: number;
    reviewThreshold?: number;
    factorWeights?: Partial<ConfidenceBreakdown>;
    decayRate?: number;
    recencyWeight?: number;
}
interface ScorerContext {
    historicalRecords: HistoricalRecord[];
    currentActionType: string;
    currentSuggestion: Record<string, any>;
    userPreferences?: Record<string, any>;
    projectComplexity?: number;
    timeDecayFactor: number;
}
export declare class ConfidenceScorer {
    private options;
    private historicalData;
    constructor(options?: ConfidenceOptions);
    setOptions(options: Partial<ConfidenceOptions>): void;
    recordHistorical(record: HistoricalRecord): void;
    getHistoricalRecords(actionType?: string): HistoricalRecord[];
    score(actionType: string, suggestion: Record<string, any>, context?: Partial<ScorerContext>): ConfidenceResult;
    private scoreHistoricalAccuracy;
    private scoreContextSimilarity;
    private computeSimilarity;
    private scoreComplexity;
    private scoreRisk;
    private scoreUserAffinity;
    private scoreTemporalRelevance;
    private getHistoricalReason;
    private getContextReason;
    private getComplexityReason;
    private getRiskReason;
    private getAffinityReason;
    private getTemporalReason;
    compare(results: ConfidenceResult[]): ConfidenceResult;
    getActionTypeStats(actionType: string): {
        total: number;
        accepted: number;
        acceptanceRate: number;
    };
    reset(): void;
}
export declare function createConfidenceScorer(options?: ConfidenceOptions): ConfidenceScorer;
export {};
