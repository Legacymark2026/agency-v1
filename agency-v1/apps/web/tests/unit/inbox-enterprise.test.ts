/**
 * apps/web/tests/unit/inbox-enterprise.test.ts
 * ──────────────────────────────────────────────────────────────
 * Suite de pruebas unitarias para las 5 Funcionalidades Enterprise del Inbox:
 * 1. AI Copilot & Auto-Reply con RAG
 * 2. Motor de Chatbot por Máquina de Estados
 * 3. Traductor Bidireccional de Idiomas en Tiempo Real
 * 4. Encuestas Automáticas de Satisfacción CSAT & NPS
 * 5. Motor Broadcast por WhatsApp con Delay Estocástico Antiban
 *
 * Pirámide de Testing - Capa de Pruebas Unitarias (70%)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateCopilotSuggestion } from '@/lib/inbox/ai-copilot';
import { processChatbotStep } from '@/lib/inbox/chatbot-flow-engine';
import { detectLanguage, translateMessage } from '@/lib/inbox/language-translator';
import { calculateCsatMetrics, generateCsatSurveyPayload } from '@/lib/inbox/csat-engine';
import { calculateStochasticDelayMs, queueBroadcastCampaign } from '@/lib/inbox/broadcast-engine';

// Mock Prisma Client
vi.mock('@/lib/prisma', () => ({
    prisma: {
        conversation: { findUnique: vi.fn() },
        user: { findUnique: vi.fn() },
    },
}));

import {
    getRealCopilotSuggestion,
    processRealChatbotStep,
    translateRealInboxMessage,
    submitRealCsatRating,
    queueRealBroadcastCampaign
} from '@/actions/inbox-enterprise-actions';

describe('Enterprise Omnichannel Inbox Master Suite Tests', () => {

    beforeEach(() => {
        vi.clearAllMocks();
    });

    // ── 1. AI Copilot RAG Tests ───────────────────────────────────────────────
    describe('1. AI Copilot & Auto-Reply RAG Engine', () => {
        it('should match price query against KB and suggest accurate response', () => {
            const suggestion = generateCopilotSuggestion('¿Cuál es el precio o costo del plan?');
            expect(suggestion.confidenceScore).toBeGreaterThan(60);
            expect(suggestion.matchedArticleTopic).toBe('Precios y Planes');
            expect(suggestion.suggestedResponse).toContain('Starter');
        });

        it('should flag high-confidence matches as autoReplyEligible', () => {
            const suggestion = generateCopilotSuggestion('¿Cuál es el precio y costo del plan?');
            expect(suggestion.autoReplyEligible).toBe(true);
        });
    });

    // ── 2. Chatbot Flow Engine Tests ──────────────────────────────────────────
    describe('2. Chatbot State Machine Engine', () => {
        it('should transition through chatbot steps from START to QUALIFIED_END', () => {
            // Step 1: Start
            const res1 = processChatbotStep('Hola');
            expect(res1.nextState.currentStep).toBe('ASK_SERVICE');
            expect(res1.quickReplies?.length).toBeGreaterThan(0);

            // Step 2: Select Service
            const res2 = processChatbotStep('Desarrollo Web / App', res1.nextState);
            expect(res2.nextState.currentStep).toBe('ASK_EMAIL');
            expect(res2.nextState.collectedData.selectedService).toBe('Desarrollo Web / App');

            // Step 3: Provide Email
            const res3 = processChatbotStep('cliente@empresa.com', res2.nextState);
            expect(res3.nextState.currentStep).toBe('QUALIFIED_END');
            expect(res3.nextState.isCompleted).toBe(true);
            expect(res3.nextState.collectedData.contactEmail).toBe('cliente@empresa.com');
        });
    });

    // ── 3. Real-time Language Translator Tests ────────────────────────────────
    describe('3. Real-time Language Translator', () => {
        it('should detect English and translate to Spanish', () => {
            const lang = detectLanguage('Hello, what is the price for your service?');
            expect(lang).toBe('en');

            const translation = translateMessage('Hello, what is the price?', 'es');
            expect(translation.detectedLanguage).toBe('en');
            expect(translation.translatedText).toContain('hola');
        });

        it('should detect French and return correct language code', () => {
            const lang = detectLanguage('Bonjour, quel est le prix?');
            expect(lang).toBe('fr');
        });
    });

    // ── 4. CSAT & NPS Survey Engine Tests ─────────────────────────────────────
    describe('4. CSAT & NPS Survey Engine', () => {
        it('should calculate accurate CSAT % and NPS score from ratings', () => {
            const ratings = [
                { id: '1', conversationId: 'c1', agentId: 'a1', score: 5, createdAt: '' },
                { id: '2', conversationId: 'c2', agentId: 'a1', score: 5, createdAt: '' },
                { id: '3', conversationId: 'c3', agentId: 'a1', score: 4, createdAt: '' },
                { id: '4', conversationId: 'c4', agentId: 'a1', score: 2, createdAt: '' },
            ];

            const metrics = calculateCsatMetrics(ratings);
            expect(metrics.totalSurveys).toBe(4);
            expect(metrics.csatPercentage).toBe(75); // 3 out of 4 are >= 4
            expect(metrics.averageScore).toBe(4.0);
            expect(metrics.npsScore).toBe(25); // (2 promoters - 1 detractor) / 4 = 25
        });

        it('should generate survey payload with 5-star rating options', () => {
            const payload = generateCsatSurveyPayload('conv-99');
            expect(payload.quickReplies.length).toBe(5);
        });
    });

    // ── 5. Broadcast Anti-Ban Engine Tests ───────────────────────────────────
    describe('5. Broadcast Engine with Stochastic Delay', () => {
        it('should generate random delays within safe jitter range (1500ms - 4200ms)', () => {
            const delay = calculateStochasticDelayMs(1500, 4200);
            expect(delay).toBeGreaterThanOrEqual(1500);
            expect(delay).toBeLessThanOrEqual(4200);
        });

        it('should queue broadcast campaign with personalized text and incremental delays', () => {
            const recipients = [
                { id: 'r1', name: 'Carlos', phoneOrEmail: '+573001234567' },
                { id: 'r2', name: 'Ana', phoneOrEmail: '+573009876543' },
            ];

            const campaign = queueBroadcastCampaign('Hola {{nombre}}, oferta especial para ti!', recipients);
            expect(campaign.totalRecipients).toBe(2);
            expect(campaign.queue[0].messageText).toContain('Hola Carlos');
            expect(campaign.queue[1].messageText).toContain('Hola Ana');
            expect(campaign.queue[1].scheduledDelayMs).toBeGreaterThan(campaign.queue[0].scheduledDelayMs);
        });
    });

    // ── 6. Real Server Actions Tests ─────────────────────────────────────────
    describe('6. Real Server Actions Integration', () => {
        it('should execute getRealCopilotSuggestion successfully', async () => {
            const res = await getRealCopilotSuggestion('¿Horarios de atención?');
            expect(res.success).toBe(true);
            expect(res.suggestion?.matchedArticleTopic).toBe('Horarios de Atención');
        });

        it('should execute submitRealCsatRating successfully', async () => {
            const res = await submitRealCsatRating('c-100', 'ag-1', 5, 'Excelente soporte!');
            expect(res.success).toBe(true);
            expect(res.metrics?.csatPercentage).toBe(100);
        });
    });
});
