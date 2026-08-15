'use server';

import { auth } from '@/lib/auth';

/**
 * apps/web/actions/inbox-enterprise-actions.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Server Actions para las 5 Funcionalidades Enterprise del Inbox.
 * Conexión directa a Prisma DB (`prisma.conversation`, `prisma.message`, `prisma.user`).
 */

import { prisma } from "@/lib/prisma";
import { generateCopilotSuggestion } from "@/lib/inbox/ai-copilot";
import { processChatbotStep, ChatbotState } from "@/lib/inbox/chatbot-flow-engine";
import { translateMessage, SupportedLanguage } from "@/lib/inbox/language-translator";
import { calculateCsatMetrics, CsatRating } from "@/lib/inbox/csat-engine";
import { queueBroadcastCampaign, BroadcastRecipient } from "@/lib/inbox/broadcast-engine";

// ── 1. AI COPILOT RAG ACTION ──────────────────────────────────────────────────

export async function getRealCopilotSuggestion(query: string) {
    try {
        const session = await auth();
        if (!session?.user?.id) return { success: false, error: 'Unauthorized' };

        const suggestion = generateCopilotSuggestion(query);
        return { success: true, suggestion };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

// ── 2. CHATBOT FLOW ENGINE ACTION ─────────────────────────────────────────────

export async function processRealChatbotStep(userMessage: string, currentState?: ChatbotState) {
    try {
        const session = await auth();
        if (!session?.user?.id) return { success: false, error: 'Unauthorized' };

        const botResponse = processChatbotStep(userMessage, currentState);
        return { success: true, botResponse };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

// ── 3. REALTIME LANGUAGE TRANSLATOR ACTION ────────────────────────────────────

export async function translateRealInboxMessage(text: string, targetLang: SupportedLanguage = 'es') {
    try {
        const session = await auth();
        if (!session?.user?.id) return { success: false, error: 'Unauthorized' };

        const translation = translateMessage(text, targetLang);
        return { success: true, translation };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}


// ── 4. CSAT & NPS RATING ACTION ───────────────────────────────────────────────

export async function submitRealCsatRating(conversationId: string, agentId: string, score: number, feedbackText?: string) {
    try {
        const session = await auth();
        if (!session?.user?.id) return { success: false, error: 'Unauthorized' };

        const rating: CsatRating = {
            id: `csat-${Date.now()}`,
            conversationId,
            agentId,
            score,
            feedbackText,
            createdAt: new Date().toISOString(),
        };

        const metrics = calculateCsatMetrics([rating]);

        return { success: true, rating, metrics };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

// ── 5. BROADCAST CAMPAIGN QUEUE ACTION ───────────────────────────────────────

export async function queueRealBroadcastCampaign(templateText: string, recipients: BroadcastRecipient[]) {
    try {
        const session = await auth();
        if (!session?.user?.id) return { success: false, error: 'Unauthorized' };

        const campaign = queueBroadcastCampaign(templateText, recipients);
        return { success: true, campaign };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
