/**
 * apps/web/tests/unit/crm-enterprise.test.ts
 * ──────────────────────────────────────────────────────────────
 * Suite de pruebas unitarias para las 5 Funcionalidades Enterprise del CRM:
 * 1. Motor CPQ & Cotizaciones PDF Dinámicas
 * 2. Motor de Enriquecimiento Corporativo de Leads
 * 3. AI Voice & Call Summarizer
 * 4. Conversión Multi-Moneda en Tiempo Real
 * 5. Gestión de Territorios & Ruteo Geográfico
 *
 * Pirámide de Testing - Capa de Pruebas Unitarias (70%)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { calculateQuote, createDigitalQuote, QuoteLineItem } from '@/lib/crm/cpq-engine';
import { enrichLeadFromEmail } from '@/lib/crm/lead-enrichment';
import { summarizeSalesCall } from '@/lib/crm/voice-summarizer';
import { convertCurrency, formatCurrencyMulti } from '@/lib/crm/multi-currency';
import { routeDealToTerritory } from '@/lib/crm/territory-router';

// Mock Prisma Client for Enterprise Actions
vi.mock('@/lib/prisma', () => ({
    prisma: {
        deal: {
            findUnique: vi.fn(),
            update: vi.fn(),
        },
        lead: {
            findUnique: vi.fn(),
            update: vi.fn(),
        },
    },
}));

import { prisma } from '@/lib/prisma';
import {
    createRealCpqQuote,
    enrichRealLead,
    summarizeRealCall,
    convertRealDealCurrency,
    routeRealDealTerritory
} from '@/actions/crm-enterprise-actions';

describe('Enterprise CRM Master Suite Unit Tests', () => {

    beforeEach(() => {
        vi.clearAllMocks();
    });

    // ── 1. CPQ Engine Tests ──────────────────────────────────────────────────
    describe('1. CPQ & Digital Quote Engine', () => {
        it('should calculate subtotal, discounts, IVA tax (19%), and grand total correctly', () => {
            const items: QuoteLineItem[] = [
                { id: '1', productName: 'Software License', unitPrice: 1000, quantity: 2, discountPct: 10 }, // 2000 gross - 200 disc = 1800 net
                { id: '2', productName: 'Onboarding', unitPrice: 500, quantity: 1, discountPct: 0 }, // 500 net
            ];

            const calc = calculateQuote(items, 19);
            expect(calc.subtotal).toBe(2500);
            expect(calc.discountTotal).toBe(200);
            expect(calc.taxableAmount).toBe(2300);
            expect(calc.taxAmount).toBe(437); // 2300 * 0.19
            expect(calc.grandTotal).toBe(2737);
        });

        it('should generate digital quote object with unique quote number and valid dates', () => {
            const items: QuoteLineItem[] = [{ id: '1', productName: 'Plan Pro', unitPrice: 1200, quantity: 1 }];
            const quote = createDigitalQuote('deal-123', 'Acme Corp', 'info@acme.com', items, 19);

            expect(quote.quoteNumber).toMatch(/^LMQ-/);
            expect(quote.status).toBe('DRAFT');
            expect(quote.calculation.grandTotal).toBeGreaterThan(0);
        });
    });

    // ── 2. Lead Enrichment Engine Tests ─────────────────────────────────────
    describe('2. Lead Enrichment Engine', () => {
        it('should extract company name, industry, and size from domain', () => {
            const profile = enrichLeadFromEmail('ceo@fintechcorp.io');
            expect(profile.companyName).toBe('Fintechcorp');
            expect(profile.industry).toBe('TECHNOLOGY');
            expect(profile.companySize).toBe('STARTUP');
            expect(profile.logoUrl).toContain('clearbit.com/fintechcorp.io');
        });

        it('should enrich e-commerce domain with retail tech stack', () => {
            const profile = enrichLeadFromEmail('support@megastore.shop');
            expect(profile.industry).toBe('E_COMMERCE');
            expect(profile.techStack).toContain('Shopify');
        });
    });

    // ── 3. AI Voice & Call Summarizer Tests ─────────────────────────────────
    describe('3. AI Voice & Call Summarizer', () => {
        it('should extract executive summary, agreements, objections, and action items', () => {
            const notes = 'El cliente estuvo de acuerdo con la propuesta. Aceptó los tiempos. Sin embargo, dijo que el precio está demasiado caro y requiere un descuento.';
            const summary = summarizeSalesCall(notes);

            expect(summary.keyAgreements.length).toBeGreaterThan(0);
            expect(summary.clientObjections.length).toBeGreaterThan(0);
            expect(summary.actionItems.length).toBeGreaterThan(0);
            expect(summary.callSentiment).toBe('CONCERNED');
        });
    });

    // ── 4. Multi-Currency Engine Tests ──────────────────────────────────────
    describe('4. Multi-Currency Engine', () => {
        it('should convert USD to EUR and COP correctly', () => {
            const eur = convertCurrency(1000, 'USD', 'EUR');
            expect(eur.targetAmount).toBe(917); // 1000 / 1.09

            const cop = convertCurrency(100, 'USD', 'COP');
            expect(cop.targetAmount).toBe(400000); // 100 / 0.00025
        });

        it('should format currency values according to regional locale', () => {
            const formattedCop = formatCurrencyMulti(1500000, 'COP');
            expect(formattedCop).toMatch(/COP|1\.500\.000/);
        });
    });

    // ── 5. Territory Auto-Router Tests ───────────────────────────────────────
    describe('5. Territory Auto-Router', () => {
        it('should route Colombia to LATAM_ANDINA territory', () => {
            const res = routeDealToTerritory('Colombia');
            expect(res.assignedZone).toBe('LATAM_ANDINA');
            expect(res.recommendedRepId).toBe('rep-latam-1');
        });

        it('should route Mexico to LATAM_NORTE territory', () => {
            const res = routeDealToTerritory('Mexico');
            expect(res.assignedZone).toBe('LATAM_NORTE');
        });

        it('should route USA to NORTH_AMERICA territory', () => {
            const res = routeDealToTerritory('United States');
            expect(res.assignedZone).toBe('NORTH_AMERICA');
        });
    });

    // ── 6. Real Server Actions Integration Tests ─────────────────────────────
    describe('6. Real Server Actions Integration', () => {
        it('should call DB and create CPQ quote successfully', async () => {
            (prisma.deal.findUnique as any).mockResolvedValueOnce({
                id: 'deal-500', companyId: 'comp-1', contactEmail: 'test@corp.com'
            });
            (prisma.deal.update as any).mockResolvedValueOnce({});

            const res = await createRealCpqQuote('deal-500', [{ id: '1', productName: 'Item 1', unitPrice: 500, quantity: 2 }]);
            expect(res.success).toBe(true);
            expect(res.quote?.calculation.grandTotal).toBe(1190); // 1000 + 19% tax
        });

        it('should enrich lead in DB successfully', async () => {
            (prisma.lead.findUnique as any).mockResolvedValueOnce({ id: 'lead-1', email: 'cto@techstart.io' });
            (prisma.lead.update as any).mockResolvedValueOnce({ id: 'lead-1', companyName: 'Techstart' });

            const res = await enrichRealLead('lead-1');
            expect(res.success).toBe(true);
            expect(res.profile?.companyName).toBe('Techstart');
        });
    });
});
