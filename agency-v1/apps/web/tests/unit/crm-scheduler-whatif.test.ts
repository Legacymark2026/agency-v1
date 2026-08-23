/**
 * apps/web/tests/unit/crm-scheduler-whatif.test.ts
 * ──────────────────────────────────────────────────────────────
 * Suite de pruebas unitarias para el Agendador Inteligente de Citas
 * y el Simulador de Escenarios "What-If" (Fase 3 del CRM).
 *
 * Pirámide de Testing - Capa de Pruebas Unitarias (70%)
 */

import { describe, it, expect } from 'vitest';
import {
    selectOptimalSalesRep,
    generateAvailableSlots,
    scheduleSmartMeeting,
    SalesRepAvailability,
    BookingSlot
} from '@/lib/crm/smart-scheduler';

import {
    simulateWhatIfRevenue,
    BaselineRevenueConfig,
    WhatIfParameters
} from '@/lib/crm/whatif-simulator';

describe('CRM Smart Scheduler & What-If Simulator Tests', () => {

    const mockReps: SalesRepAvailability[] = [
        { id: 'rep-1', name: 'Rep Busy', email: 'busy@test.com', activeDealsCount: 10, workingHours: { start: '09:00', end: '18:00' }, timezone: 'America/Bogota' },
        { id: 'rep-2', name: 'Rep Available', email: 'avail@test.com', activeDealsCount: 2, workingHours: { start: '09:00', end: '18:00' }, timezone: 'America/Bogota' },
        { id: 'rep-3', name: 'Rep Moderate', email: 'mod@test.com', activeDealsCount: 6, workingHours: { start: '09:00', end: '18:00' }, timezone: 'America/Bogota' },
    ];

    // ── 1. Smart Scheduler Tests ─────────────────────────────────────────────
    describe('1. Smart Scheduler (Round-Robin by Workload)', () => {
        it('should select the sales rep with the lowest active deals count', () => {
            const optimal = selectOptimalSalesRep(mockReps);
            expect(optimal).not.toBeNull();
            expect(optimal?.id).toBe('rep-2'); // 2 active deals
        });

        it('should generate available booking slots for a given date', () => {
            const slots = generateAvailableSlots('2026-02-15', mockReps);
            expect(slots.length).toBeGreaterThan(0);
            expect(slots[0].date).toBe('2026-02-15');
        });

        it('should schedule meeting successfully and assign the optimal rep', () => {
            const slot: BookingSlot = {
                date: '2026-02-15',
                time: '10:00',
                availableReps: mockReps,
            };

            const booking = scheduleSmartMeeting('prospect@client.com', slot, mockReps);
            expect(booking.success).toBe(true);
            expect(booking.assignedRep?.id).toBe('rep-2');
            expect(booking.meetingUrl).toMatch(/https:\/\/meet\.legacymark\.com\/room/);
        });
    });

    // ── 2. What-If Scenario Simulator Tests ──────────────────────────────────
    describe('2. What-If Revenue Scenario Simulator', () => {
        const baseline: BaselineRevenueConfig = {
            monthlyLeads: 100,
            conversionRate: 10, // 10% = 10 deals won
            avgDealSize: 2000,   // $20,000 baseline
            salesReps: 2,
        };

        it('should calculate accurate baseline revenue ($20,000 for 10 deals @ $2000)', () => {
            const params: WhatIfParameters = {
                leadVolumeChangePct: 0,
                conversionRateDeltaPct: 0,
                dealSizeChange: 0,
                salesRepChange: 0,
            };

            const result = simulateWhatIfRevenue(baseline, params);
            expect(result.baselineMonthlyRevenue).toBe(20000);
            expect(result.projectedMonthlyRevenue).toBe(20000);
            expect(result.growthPercentage).toBe(0);
        });

        it('should project revenue increase when lead volume and conversion rate increase', () => {
            const params: WhatIfParameters = {
                leadVolumeChangePct: 50, // 150 leads
                conversionRateDeltaPct: 5, // 15% conv rate = 22.5 deals
                dealSizeChange: 500, // $2500 per deal
                salesRepChange: 1, // 3 reps
            };

            const result = simulateWhatIfRevenue(baseline, params);
            expect(result.projectedMonthlyRevenue).toBeGreaterThan(result.baselineMonthlyRevenue);
            expect(result.growthPercentage).toBeGreaterThan(50);
            expect(result.insightSummary).toMatch(/ALTO CRECIMIENTO/i);
        });
    });
});
