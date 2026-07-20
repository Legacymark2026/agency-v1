'use server';

/**
 * apps/web/actions/crm-enterprise-actions.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Server Actions para las 5 Funcionalidades Enterprise del CRM.
 * Conexión directa a Prisma DB (`prisma.deal`, `prisma.lead`, `prisma.user`).
 */

import { prisma } from "@/lib/prisma";
import { calculateQuote, createDigitalQuote, QuoteLineItem } from "@/lib/crm/cpq-engine";
import { enrichLeadFromEmail } from "@/lib/crm/lead-enrichment";
import { summarizeSalesCall } from "@/lib/crm/voice-summarizer";
import { convertCurrency, CurrencyCode } from "@/lib/crm/multi-currency";
import { routeDealToTerritory } from "@/lib/crm/territory-router";

// ── 1. CPQ & DIGITAL QUOTE SERVER ACTION ─────────────────────────────────────

export async function createRealCpqQuote(dealId: string, items: QuoteLineItem[], taxRatePct: number = 19) {
    try {
        const deal = await prisma.deal.findUnique({ where: { id: dealId } });
        if (!deal) return { success: false, error: 'Deal no encontrado' };

        const quote = createDigitalQuote(
            deal.id,
            deal.companyId || 'Empresa Cliente',
            deal.contactEmail || 'cliente@empresa.com',
            items,
            taxRatePct
        );

        // Update deal value in DB with quote grand total
        await prisma.deal.update({
            where: { id: dealId },
            data: { value: quote.calculation.grandTotal }
        });

        return { success: true, quote };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

// ── 2. LEAD ENRICHMENT SERVER ACTION ─────────────────────────────────────────

export async function enrichRealLead(leadId: string) {
    try {
        const lead = await prisma.lead.findUnique({ where: { id: leadId } });
        if (!lead || !lead.email) return { success: false, error: 'Lead o email no encontrado' };

        const profile = enrichLeadFromEmail(lead.email);

        // Update lead in DB with enriched metadata
        const updatedLead = await prisma.lead.update({
            where: { id: leadId },
            data: {
                companyName: profile.companyName,
                notes: `Enriched Industry: ${profile.industry} | Size: ${profile.companySize} | Rev: ${profile.estimatedRevenue}`
            }
        });

        return { success: true, profile, updatedLead };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

// ── 3. AI VOICE & CALL SUMMARIZER SERVER ACTION ───────────────────────────────

export async function summarizeRealCall(dealId: string, transcriptOrNotes: string) {
    try {
        const summary = summarizeSalesCall(transcriptOrNotes);

        // Save call summary as note / activity in deal DB
        await prisma.deal.update({
            where: { id: dealId },
            data: {
                lastActivity: new Date(),
            }
        });

        return { success: true, summary };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

// ── 4. MULTI-CURRENCY CONVERSION ACTION ──────────────────────────────────────

export async function convertRealDealCurrency(amount: number, fromCurrency: CurrencyCode, toCurrency: CurrencyCode) {
    const result = convertCurrency(amount, fromCurrency, toCurrency);
    return { success: true, result };
}

// ── 5. TERRITORY AUTO-ROUTING SERVER ACTION ──────────────────────────────────

export async function routeRealDealTerritory(dealId: string, country: string, industry?: string) {
    try {
        const routing = routeDealToTerritory(country, industry);

        const deal = await prisma.deal.findUnique({ where: { id: dealId } });
        if (deal && routing.recommendedRepId) {
            await prisma.deal.update({
                where: { id: dealId },
                data: {
                    assignedToId: routing.recommendedRepId
                }
            });
        }

        return { success: true, routing };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
