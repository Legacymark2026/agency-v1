export type ActionType =
  | 'cut'
  | 'color'
  | 'text'
  | 'audio'
  | 'transition'
  | 'crop'
  | 'broll'
  | 'speed'
  | 'caption'
  | 'beat_sync';

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
  adjustment: (suggestion: Record<string, any>, companyId?: string) => Record<string, any>;
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

interface PatternMatch {
  rule: PatternRule;
  similarity: number;
}

function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

const DEFAULT_PATTERNS: Array<{
  actionType: ActionType;
  pattern: string;
  description: string;
  adjustmentFn: (suggestion: Record<string, any>, correction: Record<string, any>) => Record<string, any>;
  confidence: number;
}> = [
  {
    actionType: 'cut',
    pattern: 'user_prefers_longer_cuts',
    description: 'El usuario prefiere cortes más largos que los sugeridos',
    adjustmentFn: (suggestion, correction) => {
      const suggestionDuration = suggestion.duration || 3;
      const correctionDuration = correction.duration || 3;
      const ratio = correctionDuration / suggestionDuration;
      return { ...suggestion, duration: suggestionDuration * ratio, confidenceBoost: 0.1 };
    },
    confidence: 0.7,
  },
  {
    actionType: 'color',
    pattern: 'user_prefers_warm_tones',
    description: 'El usuario prefiere tonos más cálidos',
    adjustmentFn: (suggestion, correction) => {
      const tempDiff = (correction.temperature || 0) - (suggestion.temperature || 0);
      return { ...suggestion, temperature: (suggestion.temperature || 0) + tempDiff * 0.5, confidenceBoost: 0.15 };
    },
    confidence: 0.6,
  },
  {
    actionType: 'color',
    pattern: 'user_prefers_high_contrast',
    description: 'El usuario prefiere alto contraste',
    adjustmentFn: (suggestion, correction) => {
      const contrastDiff = (correction.contrast || 0) - (suggestion.contrast || 0);
      return { ...suggestion, contrast: (suggestion.contrast || 0) + contrastDiff * 0.5, confidenceBoost: 0.15 };
    },
    confidence: 0.65,
  },
  {
    actionType: 'text',
    pattern: 'user_prefers_larger_text',
    description: 'El usuario prefiere texto más grande',
    adjustmentFn: (suggestion, correction) => {
      const sizeDiff = (correction.fontSize || 24) - (suggestion.fontSize || 24);
      return { ...suggestion, fontSize: (suggestion.fontSize || 24) + sizeDiff * 0.5, confidenceBoost: 0.1 };
    },
    confidence: 0.6,
  },
  {
    actionType: 'audio',
    pattern: 'user_prefers_lower_music',
    description: 'El usuario prefiere volumen de música más bajo',
    adjustmentFn: (suggestion, correction) => {
      const volDiff = (correction.musicVolume || -20) - (suggestion.musicVolume || -20);
      return { ...suggestion, musicVolume: (suggestion.musicVolume || -20) + volDiff * 0.5, confidenceBoost: 0.12 };
    },
    confidence: 0.55,
  },
  {
    actionType: 'transition',
    pattern: 'user_prefers_faster_transitions',
    description: 'El usuario prefiere transiciones más rápidas',
    adjustmentFn: (suggestion, correction) => {
      const durationDiff = (correction.duration || 0.5) - (suggestion.duration || 0.5);
      return { ...suggestion, duration: Math.max(0.1, (suggestion.duration || 0.5) + durationDiff * 0.5), confidenceBoost: 0.15 };
    },
    confidence: 0.65,
  },
  {
    actionType: 'speed',
    pattern: 'user_prefers_slower_motion',
    description: 'El usuario prefiere efectos de cámara lenta más sutiles',
    adjustmentFn: (suggestion, correction) => {
      const speedDiff = (correction.speed || 1) - (suggestion.speed || 1);
      return { ...suggestion, speed: (suggestion.speed || 1) + speedDiff * 0.5, confidenceBoost: 0.1 };
    },
    confidence: 0.6,
  },
];

export class LearningEngine {
  private profiles: Map<string, LearningProfile> = new Map();
  private rules: PatternRule[] = [];
  private corrections: AICorrection[] = [];

  constructor() {
    this.initializeDefaultRules();
  }

  private initializeDefaultRules(): void {
    for (const pattern of DEFAULT_PATTERNS) {
      this.addRule(this.createRuleFromPattern(pattern));
    }
  }

  private createRuleFromPattern(pattern: typeof DEFAULT_PATTERNS[0]): PatternRule {
    const rule: PatternRule = {
      id: generateId('rule'),
      actionType: pattern.actionType,
      pattern: pattern.pattern,
      condition: () => true,
      adjustment: (suggestion: Record<string, any>, companyId?: string) => {
        const lastCorrections = this.getLastCorrectionsForAction(
          pattern.actionType,
          5,
          companyId,
        );
        if (lastCorrections.length === 0) return suggestion;

        const avgCorrection = this.averageCorrections(lastCorrections);
        return pattern.adjustmentFn(suggestion, avgCorrection);
      },
      confidence: pattern.confidence,
      occurrences: 0,
      lastApplied: 0,
    };
    return rule;
  }

  recordCorrection(correction: AICorrection): void {
    this.corrections.push(correction);
    let profile = this.profiles.get(correction.companyId);
    if (!profile) {
      profile = {
        companyId: correction.companyId,
        totalCorrections: 0,
        patterns: [],
        actionStats: {} as Record<ActionType, ActionStats>,
        commonCorrections: new Map(),
        lastUpdated: Date.now(),
      };
      this.profiles.set(correction.companyId, profile);
    }

    profile.totalCorrections++;

    if (!profile.actionStats[correction.actionType]) {
      profile.actionStats[correction.actionType] = {
        total: 0,
        accepted: 0,
        rejected: 0,
        modified: 0,
        averageConfidenceDelta: 0,
        trend: 'stable',
      };
    }

    const stats = profile.actionStats[correction.actionType];
    stats.total++;

    if (correction.confidenceDelta && correction.confidenceDelta > 0) {
      stats.accepted++;
    } else if (correction.confidenceDelta && correction.confidenceDelta < 0) {
      stats.rejected++;
      stats.modified++;
    }

    if (correction.confidenceDelta) {
      stats.averageConfidenceDelta =
        (stats.averageConfidenceDelta * (stats.total - 1) +
          correction.confidenceDelta) /
        stats.total;

      if (stats.averageConfidenceDelta > 0.1) stats.trend = 'improving';
      else if (stats.averageConfidenceDelta < -0.1) stats.trend = 'declining';
      else stats.trend = 'stable';
    }

    if (correction.category) {
      const key = `${correction.actionType}:${correction.category}`;
      profile.commonCorrections.set(
        key,
        (profile.commonCorrections.get(key) || 0) + 1,
      );
    }

    this.updatePatterns(profile, correction);
    profile.lastUpdated = Date.now();
  }

  private updatePatterns(
    profile: LearningProfile,
    correction: AICorrection,
  ): void {
    for (const rule of this.rules.filter(
      (r) => r.actionType === correction.actionType,
    )) {
      const key = this.correctionMatchesPattern(correction, rule);
      if (key > 0.5) {
        rule.occurrences++;
        rule.lastApplied = Date.now();
        rule.confidence = Math.min(
          0.95,
          rule.confidence + 0.05 * key,
        );

        if (!profile.patterns.find((p) => p.id === rule.id)) {
          profile.patterns.push(rule);
        }
      }
    }
  }

  private correctionMatchesPattern(
    correction: AICorrection,
    rule: PatternRule,
  ): number {
    let similarity = 0;
    const aiSuggestion = correction.aiSuggestion;
    const userCorrection = correction.userCorrection;

    const diffKeys = [
      ...new Set([
        ...Object.keys(aiSuggestion),
        ...Object.keys(userCorrection),
      ]),
    ].filter((k) => k !== 'confidence' && k !== 'id');

    let changedFields = 0;
    for (const key of diffKeys) {
      if (
        aiSuggestion[key] !== undefined &&
        userCorrection[key] !== undefined &&
        JSON.stringify(aiSuggestion[key]) !==
          JSON.stringify(userCorrection[key])
      ) {
        changedFields++;
      }
    }

    similarity = changedFields / Math.max(1, diffKeys.length);

    return similarity;
  }

  private averageCorrections(
    corrections: AICorrection[],
  ): Record<string, any> {
    if (corrections.length === 0) return {};

    const averaged: Record<string, any> = {};
    const numericFields = new Set<string>();
    const allFields = new Set<string>();

    for (const c of corrections) {
      for (const key of Object.keys(c.userCorrection)) {
        allFields.add(key);
        if (typeof c.userCorrection[key] === 'number') {
          numericFields.add(key);
        }
      }
    }

    for (const field of numericFields) {
      const values = corrections
        .map((c) => c.userCorrection[field])
        .filter((v) => typeof v === 'number');
      if (values.length > 0) {
        averaged[field] =
          values.reduce((a, b) => a + b, 0) / values.length;
      }
    }

    for (const field of allFields) {
      if (!numericFields.has(field)) {
        const latestCorrection = corrections[corrections.length - 1];
        if (latestCorrection.userCorrection[field] !== undefined) {
          averaged[field] = latestCorrection.userCorrection[field];
        }
      }
    }

    return averaged;
  }

  getAdjustedSuggestion(
    companyId: string,
    actionType: ActionType,
    suggestion: Record<string, any>,
  ): { suggestion: Record<string, any>; confidenceDelta: number; rulesApplied: string[] } {
    const profile = this.profiles.get(companyId);
    if (!profile) {
      return { suggestion, confidenceDelta: 0, rulesApplied: [] };
    }

    let adjustedSuggestion = { ...suggestion };
    let totalDelta = 0;
    const rulesApplied: string[] = [];

    const relevantRules = this.rules.filter(
      (r) =>
        r.actionType === actionType &&
        r.occurrences > 2 &&
        r.confidence > 0.5,
    );

    for (const rule of relevantRules) {
      const context: CorrectionContext = {
        companyId,
        previousCorrections: this.getCorrectionsForCompany(companyId),
        similarities: new Map(),
      };

      if (rule.condition(context)) {
        adjustedSuggestion = rule.adjustment(adjustedSuggestion, companyId);
        totalDelta += rule.confidence * 0.1;
        rulesApplied.push(rule.pattern);
        rule.lastApplied = Date.now();
      }
    }

    adjustedSuggestion.confidence =
      (adjustedSuggestion.confidence || 0.5) + totalDelta;
    adjustedSuggestion.confidence = Math.max(
      0,
      Math.min(1, adjustedSuggestion.confidence),
    );

    return {
      suggestion: adjustedSuggestion,
      confidenceDelta: totalDelta,
      rulesApplied,
    };
  }

  addRule(rule: PatternRule): void {
    const existingIndex = this.rules.findIndex(
      (r) => r.pattern === rule.pattern && r.actionType === rule.actionType,
    );
    if (existingIndex >= 0) {
      this.rules[existingIndex] = rule;
    } else {
      this.rules.push(rule);
    }
  }

  removeRule(ruleId: string): void {
    this.rules = this.rules.filter((r) => r.id !== ruleId);
  }

  getProfile(companyId: string): LearningProfile | undefined {
    return this.profiles.get(companyId);
  }

  getRules(): PatternRule[] {
    return [...this.rules];
  }

  getCorrectionsForCompany(companyId: string): AICorrection[] {
    return this.corrections.filter((c) => c.companyId === companyId);
  }

  private getLastCorrectionsForAction(
    actionType: ActionType,
    count: number,
    companyId?: string,
  ): AICorrection[] {
    let filtered = this.corrections.filter((c) => c.actionType === actionType);
    if (companyId) {
      filtered = filtered.filter((c) => c.companyId === companyId);
    }
    return filtered
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, count);
  }

  getActionTrend(
    companyId: string,
    actionType: ActionType,
  ): string {
    const profile = this.profiles.get(companyId);
    if (!profile?.actionStats[actionType]) return 'stable';
    return profile.actionStats[actionType].trend;
  }

  getTopPatterns(companyId: string, limit: number = 5): PatternRule[] {
    const profile = this.profiles.get(companyId);
    if (!profile) return [];

    return profile.patterns
      .sort((a, b) => b.occurrences - a.occurrences)
      .slice(0, limit);
  }

  resetProfile(companyId: string): void {
    this.profiles.delete(companyId);
  }
}

export function createLearningEngine(): LearningEngine {
  return new LearningEngine();
}
