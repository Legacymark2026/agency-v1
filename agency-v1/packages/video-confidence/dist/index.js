const DEFAULT_OPTIONS = {
    minThreshold: 0.3,
    reviewThreshold: 0.7,
    factorWeights: {
        historicalAccuracy: 0.3,
        contextSimilarity: 0.2,
        complexityScore: 0.15,
        riskScore: 0.15,
        userAffinity: 0.1,
        temporalRelevance: 0.1,
    },
    decayRate: 0.05,
    recencyWeight: 2.0,
};
export class ConfidenceScorer {
    constructor(options) {
        this.historicalData = new Map();
        this.options = Object.assign(Object.assign({}, DEFAULT_OPTIONS), options);
    }
    setOptions(options) {
        this.options = Object.assign(Object.assign({}, this.options), options);
    }
    recordHistorical(record) {
        const key = record.actionType;
        const records = this.historicalData.get(key) || [];
        records.push(record);
        if (records.length > 1000) {
            records.shift();
        }
        this.historicalData.set(key, records);
    }
    getHistoricalRecords(actionType) {
        if (actionType) {
            return this.historicalData.get(actionType) || [];
        }
        const all = [];
        for (const records of this.historicalData.values()) {
            all.push(...records);
        }
        return all;
    }
    score(actionType, suggestion, context) {
        const records = this.historicalData.get(actionType) || [];
        const weights = this.options.factorWeights;
        const historicalAccuracy = this.scoreHistoricalAccuracy(records, actionType);
        const contextSimilarity = this.scoreContextSimilarity(suggestion, records);
        const complexityScore = this.scoreComplexity(suggestion, (context === null || context === void 0 ? void 0 : context.projectComplexity) || 0.5);
        const riskScore = this.scoreRisk(suggestion, actionType);
        const userAffinity = this.scoreUserAffinity(suggestion, context === null || context === void 0 ? void 0 : context.userPreferences);
        const temporalRelevance = this.scoreTemporalRelevance(records, this.options.decayRate || 0.05);
        const breakdown = {
            historicalAccuracy,
            contextSimilarity,
            complexityScore,
            riskScore,
            userAffinity,
            temporalRelevance,
        };
        const factors = [
            {
                name: 'Precisión histórica',
                weight: weights.historicalAccuracy || 0.3,
                score: historicalAccuracy,
                reason: this.getHistoricalReason(records.length, historicalAccuracy),
            },
            {
                name: 'Similaridad de contexto',
                weight: weights.contextSimilarity || 0.2,
                score: contextSimilarity,
                reason: this.getContextReason(contextSimilarity),
            },
            {
                name: 'Complejidad',
                weight: weights.complexityScore || 0.15,
                score: complexityScore,
                reason: this.getComplexityReason(complexityScore),
            },
            {
                name: 'Riesgo',
                weight: weights.riskScore || 0.15,
                score: riskScore,
                reason: this.getRiskReason(riskScore),
            },
            {
                name: 'Afinidad del usuario',
                weight: weights.userAffinity || 0.1,
                score: userAffinity,
                reason: this.getAffinityReason(userAffinity),
            },
            {
                name: 'Relevancia temporal',
                weight: weights.temporalRelevance || 0.1,
                score: temporalRelevance,
                reason: this.getTemporalReason(temporalRelevance),
            },
        ];
        const overall = factors.reduce((sum, f) => sum + f.score * f.weight, 0);
        const recommendation = overall >= (this.options.reviewThreshold || 0.7)
            ? 'accept'
            : overall >= (this.options.minThreshold || 0.3)
                ? 'review'
                : 'reject';
        return {
            overall: Math.round(overall * 100),
            factors,
            breakdown,
            recommendation,
            metadata: {
                totalHistoricalRecords: records.length,
                actionType,
                timestamp: Date.now(),
            },
        };
    }
    scoreHistoricalAccuracy(records, _actionType) {
        if (records.length === 0)
            return 0.5;
        const recentRecords = records.slice(-50);
        const accepted = recentRecords.filter((r) => r.accepted).length;
        const acceptanceRate = accepted / recentRecords.length;
        const baseScore = acceptanceRate;
        const recencyBonus = Math.min(0.2, recentRecords.length * 0.01);
        return Math.min(1, baseScore + recencyBonus);
    }
    scoreContextSimilarity(suggestion, records) {
        if (records.length === 0)
            return 0.5;
        const recentAccepted = records.filter((r) => r.accepted).slice(-20);
        if (recentAccepted.length === 0)
            return 0.4;
        const similarities = recentAccepted.map((record) => {
            return this.computeSimilarity(suggestion, record.suggested);
        });
        const avgSimilarity = similarities.reduce((a, b) => a + b, 0) / similarities.length;
        return avgSimilarity;
    }
    computeSimilarity(a, b) {
        const allKeys = new Set([
            ...Object.keys(a),
            ...Object.keys(b),
        ]);
        if (allKeys.size === 0)
            return 0.5;
        let matchCount = 0;
        let totalComparable = 0;
        for (const key of allKeys) {
            if (a[key] === undefined || b[key] === undefined)
                continue;
            totalComparable++;
            if (typeof a[key] === 'number' && typeof b[key] === 'number') {
                const maxVal = Math.max(Math.abs(a[key]), Math.abs(b[key]), 1);
                const diff = Math.abs(a[key] - b[key]);
                if (diff / maxVal < 0.2)
                    matchCount++;
            }
            else if (typeof a[key] === 'string' &&
                typeof b[key] === 'string') {
                if (a[key] === b[key])
                    matchCount++;
            }
            else if (typeof a[key] === 'boolean' && typeof b[key] === 'boolean') {
                if (a[key] === b[key])
                    matchCount++;
            }
        }
        return totalComparable > 0 ? matchCount / totalComparable : 0.5;
    }
    scoreComplexity(suggestion, projectComplexity) {
        const paramCount = Object.keys(suggestion).length;
        const complexityFromParams = Math.min(1, paramCount / 20);
        const combinedComplexity = complexityFromParams * 0.4 + projectComplexity * 0.6;
        return 1 - combinedComplexity;
    }
    scoreRisk(suggestion, actionType) {
        let riskFactors = 0;
        let totalFactors = 0;
        const highRiskActions = ['cut', 'speed', 'crop'];
        const mediumRiskActions = ['color', 'transition'];
        totalFactors++;
        if (highRiskActions.includes(actionType)) {
            riskFactors += 1;
        }
        else if (mediumRiskActions.includes(actionType)) {
            riskFactors += 0.5;
        }
        if (suggestion.duration !== undefined && suggestion.duration > 10) {
            totalFactors++;
            riskFactors += 0.7;
        }
        if (suggestion.confidence !== undefined && suggestion.confidence < 0.5) {
            totalFactors++;
            riskFactors += 0.8;
        }
        totalFactors = Math.max(1, totalFactors);
        return 1 - riskFactors / totalFactors;
    }
    scoreUserAffinity(_suggestion, userPreferences) {
        if (!userPreferences || Object.keys(userPreferences).length === 0) {
            return 0.5;
        }
        return 0.6;
    }
    scoreTemporalRelevance(records, decayRate) {
        if (records.length === 0)
            return 0.5;
        const now = Date.now();
        const recentRecords = records.filter((r) => {
            const age = (now - r.timestamp) / (1000 * 60 * 60 * 24);
            return age < 30;
        });
        if (recentRecords.length === 0)
            return 0.3;
        const weightedScore = recentRecords.reduce((sum, r) => {
            const ageInDays = (now - r.timestamp) / (1000 * 60 * 60 * 24);
            const weight = Math.exp(-decayRate * ageInDays);
            return sum + (r.accepted ? weight : 0);
        }, 0);
        const totalWeight = recentRecords.reduce((sum, r) => {
            const ageInDays = (now - r.timestamp) / (1000 * 60 * 60 * 24);
            return sum + Math.exp(-decayRate * ageInDays);
        }, 0);
        return totalWeight > 0 ? weightedScore / totalWeight : 0.5;
    }
    getHistoricalReason(recordCount, accuracy) {
        if (recordCount === 0)
            return 'Sin datos históricos disponibles';
        if (accuracy > 0.8)
            return `Alta precisión histórica: ${Math.round(accuracy * 100)}% de aceptación`;
        if (accuracy > 0.5)
            return `Precisión moderada: ${Math.round(accuracy * 100)}% de aceptación`;
        return `Baja precisión histórica: ${Math.round(accuracy * 100)}% de aceptación`;
    }
    getContextReason(similarity) {
        if (similarity > 0.8)
            return 'Muy similar a sugerencias aceptadas anteriormente';
        if (similarity > 0.5)
            return 'Moderadamente similar a sugerencias previas';
        return 'Poca similitud con sugerencias previas';
    }
    getComplexityReason(score) {
        if (score > 0.7)
            return 'Baja complejidad — bajo riesgo de errores';
        if (score > 0.4)
            return 'Complejidad moderada';
        return 'Alta complejidad — revisar cuidadosamente';
    }
    getRiskReason(score) {
        if (score > 0.7)
            return 'Bajo riesgo — edición segura';
        if (score > 0.4)
            return 'Riesgo moderado';
        return 'Alto riesgo — afecta múltiples elementos';
    }
    getAffinityReason(score) {
        if (score > 0.7)
            return 'Fuerte alineación con preferencias del usuario';
        if (score > 0.4)
            return 'Alineación moderada con preferencias';
        return 'Sin datos de preferencias del usuario';
    }
    getTemporalReason(score) {
        if (score > 0.7)
            return 'Basado en comportamiento reciente';
        if (score > 0.4)
            return 'Basado en datos históricos parciales';
        return 'Basado en datos históricos antiguos';
    }
    compare(results) {
        return results.reduce((best, current) => current.overall > best.overall ? current : best);
    }
    getActionTypeStats(actionType) {
        const records = this.historicalData.get(actionType) || [];
        const accepted = records.filter((r) => r.accepted).length;
        return {
            total: records.length,
            accepted,
            acceptanceRate: records.length > 0 ? accepted / records.length : 0,
        };
    }
    reset() {
        this.historicalData.clear();
    }
}
export function createConfidenceScorer(options) {
    return new ConfidenceScorer(options);
}
