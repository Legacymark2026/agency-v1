/**
 * apps/web/tests/unit/crm-ai-engine.test.ts
 * ──────────────────────────────────────────────────────────────
 * Suite de pruebas unitarias para el motor de IA Revenue Intelligence,
 * Predictive Win Probability, Next Best Action y Sentiment NLP.
 *
 * Pirámide de Testing - Capa de Pruebas Unitarias (70%)
 */

import { describe, it, expect } from 'vitest';
import {
    calculateWinProbability,
    predictNextBestAction,
    analyzeTextSentiment,
    evaluateStagnationRisk,
    DealData
} from '@/lib/crm/ai-revenue-engine';

describe('CRM AI Revenue Intelligence Engine Tests', () => {

    // ── 1. Predictive Win Probability ───────────────────────────────────────
    describe('1. Predictive Win Probability Calculator', () => {
        it('should return 100% win probability for Closed Won deals', () => {
            const deal: DealData = {
                id: 'deal-1', title: 'Enterprise Contract', value: 50000,
                stage: 'Closed Won', daysInStage: 2, interactionCount: 10,
                daysSinceLastActivity: 0
            };
            const res = calculateWinProbability(deal);
            expect(res.winProbability).toBe(100);
            expect(res.riskLevel).toBe('LOW');
        });

        it('should return 0% win probability for Closed Lost deals', () => {
            const deal: DealData = {
                id: 'deal-2', title: 'Lost Opportunity', value: 12000,
                stage: 'Closed Lost', daysInStage: 15, interactionCount: 2,
                daysSinceLastActivity: 20
            };
            const res = calculateWinProbability(deal);
            expect(res.winProbability).toBe(0);
            expect(res.riskLevel).toBe('CRITICAL');
        });

        it('should increase probability when interaction count and lead score are high', () => {
            const deal: DealData = {
                id: 'deal-3', title: 'High Intent SaaS Subscription', value: 25000,
                stage: 'Proposal Sent', daysInStage: 2, interactionCount: 8,
                daysSinceLastActivity: 1, leadScore: 90, leadSource: 'Referral'
            };
            const res = calculateWinProbability(deal);
            expect(res.winProbability).toBeGreaterThan(75);
            expect(res.confidence).toBe('HIGH');
            expect(res.drivers.some(d => d.impact === 'POSITIVE')).toBe(true);
        });

        it('should penalize probability for prolonged inactivity', () => {
            const deal: DealData = {
                id: 'deal-4', title: 'Stale Deal', value: 15000,
                stage: 'Proposal Sent', daysInStage: 18, interactionCount: 1,
                daysSinceLastActivity: 14, avgStageDuration: 7
            };
            const res = calculateWinProbability(deal);
            expect(res.winProbability).toBeLessThan(50);
            expect(res.riskLevel).toMatch(/HIGH|CRITICAL/);
        });
    });

    // ── 2. Next Best Action Engine ──────────────────────────────────────────
    describe('2. Next Best Action (NBA) Recommendation Engine', () => {
        it('should recommend immediate WhatsApp reactivation for deals inactive > 7 days', () => {
            const deal: DealData = {
                id: 'deal-5', title: 'Inactive Prospect', value: 8000,
                stage: 'Contacted', daysInStage: 10, interactionCount: 1,
                daysSinceLastActivity: 8
            };
            const nba = predictNextBestAction(deal);
            expect(nba.recommendedChannel).toBe('WHATSAPP');
            expect(nba.urgency).toBe('IMMEDIATE');
            expect(nba.action).toMatch(/Reactivación/i);
        });

        it('should recommend Call or Demo for deals in Negotiation stage', () => {
            const deal: DealData = {
                id: 'deal-6', title: 'Closing Retainer', value: 30000,
                stage: 'Negotiation', daysInStage: 5, interactionCount: 6,
                daysSinceLastActivity: 1
            };
            const nba = predictNextBestAction(deal);
            expect(nba.recommendedChannel).toBe('CALL');
            expect(nba.urgency).toBe('HIGH');
        });
    });

    // ── 3. Sentiment & Intent NLP Classifier ────────────────────────────────
    describe('3. Sentiment & Intent NLP Classifier', () => {
        it('should classify enthusiastic purchase messages as POSITIVE and PURCHASE_INTENT', () => {
            const text = 'Excelente propuesta, me interesa comprar el plan anual hoy mismo';
            const res = analyzeTextSentiment(text);
            expect(res.sentiment).toMatch(/POSITIVE|URGENT/);
            expect(res.intent).toBe('PURCHASE_INTENT');
            expect(res.score).toBeGreaterThan(0.3);
        });

        it('should classify price complaints as NEGATIVE and PRICE_OBJECTION', () => {
            const text = 'El precio está demasiado caro y no puedo pagar eso';
            const res = analyzeTextSentiment(text);
            expect(res.sentiment).toBe('NEGATIVE');
            expect(res.intent).toBe('PRICE_OBJECTION');
            expect(res.score).toBeLessThan(0);
        });

        it('should detect urgency when keywords like "urgente" or "hoy" are present', () => {
            const text = 'Necesitamos agendar una reunión urgente hoy';
            const res = analyzeTextSentiment(text);
            expect(res.urgency).toBe('URGENT');
            expect(res.intent).toBe('SCHEDULING');
        });
    });

    // ── 4. Stagnation Risk & Anomaly Detector ────────────────────────────────
    describe('4. Stagnation Risk & Anomaly Detector', () => {
        it('should flag deals exceeding 2x avg duration as CRITICAL stagnation risk', () => {
            const res = evaluateStagnationRisk(20, 7);
            expect(res.isStagnant).toBe(true);
            expect(res.riskScore).toBeGreaterThanOrEqual(90);
            expect(res.daysOverdue).toBe(13);
        });

        it('should not flag deals within standard stage duration', () => {
            const res = evaluateStagnationRisk(3, 7);
            expect(res.isStagnant).toBe(false);
            expect(res.riskScore).toBeLessThan(40);
        });
    });
});
