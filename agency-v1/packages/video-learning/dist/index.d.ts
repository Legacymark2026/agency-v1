export type ActionType = 'cut' | 'color' | 'text' | 'audio' | 'transition' | 'crop' | 'broll' | 'speed' | 'caption' | 'beat_sync';
export interface AICorrection {
    id: string;
    companyId: string;
    sessionId?: string;
    actionType: ActionType;
    aiSuggestion: Record<string, any>;
    userCorrection: Record<string, any>;
    category?: string;
    pattern?: string;
    confidenceDelta?: number;
    createdAt: number;
}
export interface PatternRule {
    id: string;
    actionType: ActionType;
    pattern: string;
    condition: (context: CorrectionContext) => boolean;
    adjustment: (suggestion: Record<string, any>) => Record<string, any>;
    confidence: number;
    occurrences: number;
    lastApplied: number;
}
export interface CorrectionContext {
    companyId: string;
    projectType?: string;
    platform?: string;
    contentGenre?: string;
    previousCorrections: AICorrection[];
    similarities: Map<string, number>;
}
export interface LearningProfile {
    companyId: string;
    totalCorrections: number;
    patterns: PatternRule[];
    actionStats: Record<ActionType, ActionStats>;
    commonCorrections: Map<string, number>;
    lastUpdated: number;
}
export interface ActionStats {
    total: number;
    accepted: number;
    rejected: number;
    modified: number;
    averageConfidenceDelta: number;
    trend: 'improving' | 'stable' | 'declining';
}
export declare class LearningEngine {
    private profiles;
    private rules;
    constructor();
    private initializeDefaultRules;
    private createRuleFromPattern;
    recordCorrection(correction: AICorrection): void;
    private updatePatterns;
    private correctionMatchesPattern;
    private averageCorrections;
    getAdjustedSuggestion(companyId: string, actionType: ActionType, suggestion: Record<string, any>): {
        suggestion: Record<string, any>;
        confidenceDelta: number;
        rulesApplied: string[];
    };
    addRule(rule: PatternRule): void;
    removeRule(ruleId: string): void;
    getProfile(companyId: string): LearningProfile | undefined;
    getRules(): PatternRule[];
    getCorrectionsForCompany(companyId: string): AICorrection[];
    private getLastCorrectionsForAction;
    getActionTrend(companyId: string, actionType: ActionType): string;
    getTopPatterns(companyId: string, limit?: number): PatternRule[];
    resetProfile(companyId: string): void;
}
export declare function createLearningEngine(): LearningEngine;
