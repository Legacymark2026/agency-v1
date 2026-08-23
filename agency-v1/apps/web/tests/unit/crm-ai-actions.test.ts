/**
 * apps/web/tests/unit/crm-ai-actions.test.ts
 * ──────────────────────────────────────────────────────────────
 * Tests unitarios para las Server Actions reales de IA CRM (crm-ai-actions.ts).
 *
 * Pirámide de Testing - Capa de Pruebas Unitarias (70%)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Prisma Client
vi.mock('@/lib/prisma', () => ({
    prisma: {
        deal: {
            findUnique: vi.fn(),
            findMany: vi.fn(),
            count: vi.fn(),
            aggregate: vi.fn(),
        },
        lead: {
            count: vi.fn(),
        },
        user: {
            findMany: vi.fn(),
            count: vi.fn(),
        },
    },
}));

import { prisma } from '@/lib/prisma';
import {
    getRealDealAiInsights,
    getRealAttributionData,
    getRealSalesReps,
    getRealWhatIfBaseline
} from '@/actions/crm-ai-actions';

describe('CRM Real Server Actions Tests', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    // ── 1. getRealDealAiInsights ──────────────────────────────────────────────
    describe('1. getRealDealAiInsights', () => {
        it('should fetch real deal from DB and return AI insights', async () => {
            (prisma.deal.findUnique as any).mockResolvedValueOnce({
                id: 'deal-100',
                title: 'Contrato Anual Enterprise',
                value: 45000,
                stage: 'Proposal Sent',
                probability: 60,
                source: 'LinkedIn Ads',
                companyId: 'comp-1',
                updatedAt: new Date(),
                lastActivity: new Date(),
            });

            const res = await getRealDealAiInsights('deal-100');
            expect(res.success).toBe(true);
            expect(res.dealData?.title).toBe('Contrato Anual Enterprise');
            expect(res.winResult?.winProbability).toBeGreaterThan(0);
            expect(res.nbaResult?.action).toBeDefined();
        });

        it('should handle missing deal gracefully', async () => {
            (prisma.deal.findUnique as any).mockResolvedValueOnce(null);

            const res = await getRealDealAiInsights('deal-missing');
            expect(res.success).toBe(false);
            expect(res.error).toMatch(/not found/i);
        });
    });

    // ── 2. getRealAttributionData ─────────────────────────────────────────────
    describe('2. getRealAttributionData', () => {
        it('should calculate attribution shares from real won deals in DB', async () => {
            (prisma.deal.findMany as any).mockResolvedValueOnce([
                { id: 'd1', value: 10000, source: 'Google Ads', createdAt: new Date() },
                { id: 'd2', value: 20000, source: 'Meta Ads', createdAt: new Date() },
            ]);

            const res = await getRealAttributionData('comp-1', 'LINEAR');
            expect(res.success).toBe(true);
            expect(res.totalRevenue).toBe(30000);
            expect(res.attributionShares?.length).toBeGreaterThan(0);
        });
    });

    // ── 3. getRealSalesReps ───────────────────────────────────────────────────
    describe('3. getRealSalesReps', () => {
        it('should fetch real sales reps and compute workload from DB', async () => {
            (prisma.user.findMany as any).mockResolvedValueOnce([
                { id: 'u1', name: 'Laura Restrepo', email: 'laura@test.com' },
            ]);
            (prisma.deal.count as any).mockResolvedValueOnce(3);

            const reps = await getRealSalesReps('comp-1');
            expect(reps.length).toBe(1);
            expect(reps[0].name).toBe('Laura Restrepo');
            expect(reps[0].activeDealsCount).toBe(3);
        });
    });

    // ── 4. getRealWhatIfBaseline ──────────────────────────────────────────────
    describe('4. getRealWhatIfBaseline', () => {
        it('should calculate baseline metrics from real DB queries', async () => {
            (prisma.lead.count as any).mockResolvedValueOnce(250);
            (prisma.deal.count as any).mockResolvedValueOnce(25);
            (prisma.deal.aggregate as any).mockResolvedValueOnce({ _avg: { value: 3000 } });
            (prisma.user.count as any).mockResolvedValueOnce(5);

            const baseline = await getRealWhatIfBaseline('comp-1');
            expect(baseline.monthlyLeads).toBe(250);
            expect(baseline.conversionRate).toBe(10.0); // 25/250 * 100
            expect(baseline.avgDealSize).toBe(3000);
            expect(baseline.salesReps).toBe(5);
        });
    });
});
