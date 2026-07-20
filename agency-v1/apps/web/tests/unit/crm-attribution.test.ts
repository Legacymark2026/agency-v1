/**
 * apps/web/tests/unit/crm-attribution.test.ts
 * ──────────────────────────────────────────────────────────────
 * Suite de pruebas unitarias para el motor de Atribución Multi-Táctil
 * (First Touch, Last Touch, Linear, W-Shaped, Time-Decay) y LTV de Cohortes.
 *
 * Pirámide de Testing - Capa de Pruebas Unitarias (70%)
 */

import { describe, it, expect } from 'vitest';
import {
    calculateMultiTouchAttribution,
    calculateCohortLTV,
    Touchpoint
} from '@/lib/crm/attribution-engine';

describe('CRM Multi-Touch Attribution & LTV Engine Tests', () => {

    const mockTouchpoints: Touchpoint[] = [
        { id: 't1', channel: 'Google Ads', timestamp: '2026-01-01T10:00:00Z', eventType: 'FIRST_VISIT' },
        { id: 't2', channel: 'Email Campaign', timestamp: '2026-01-05T14:00:00Z', eventType: 'LEAD_CAPTURED' },
        { id: 't3', channel: 'LinkedIn Ads', timestamp: '2026-01-10T16:00:00Z', eventType: 'DEMO_SCHEDULED' },
        { id: 't4', channel: 'Direct', timestamp: '2026-01-15T11:00:00Z', eventType: 'DEAL_WON' },
    ];

    const dealValue = 10000;

    // ── 1. First Touch Model ────────────────────────────────────────────────
    describe('1. FIRST_TOUCH Model', () => {
        it('should attribute 100% of revenue to the initial touchpoint channel', () => {
            const res = calculateMultiTouchAttribution(dealValue, mockTouchpoints, 'FIRST_TOUCH');
            const googleAdsShare = res.find(r => r.channel === 'Google Ads');

            expect(googleAdsShare).toBeDefined();
            expect(googleAdsShare?.attributedRevenue).toBe(10000);
            expect(googleAdsShare?.percentage).toBe(100);
        });
    });

    // ── 2. Last Touch Model ─────────────────────────────────────────────────
    describe('2. LAST_TOUCH Model', () => {
        it('should attribute 100% of revenue to the final converting channel', () => {
            const res = calculateMultiTouchAttribution(dealValue, mockTouchpoints, 'LAST_TOUCH');
            const directShare = res.find(r => r.channel === 'Direct');

            expect(directShare).toBeDefined();
            expect(directShare?.attributedRevenue).toBe(10000);
            expect(directShare?.percentage).toBe(100);
        });
    });

    // ── 3. Linear Model ─────────────────────────────────────────────────────
    describe('3. LINEAR Model', () => {
        it('should distribute revenue equally across all touchpoints (25% each for 4 touches)', () => {
            const res = calculateMultiTouchAttribution(dealValue, mockTouchpoints, 'LINEAR');

            expect(res.length).toBe(4);
            res.forEach(share => {
                expect(share.percentage).toBe(25);
                expect(share.attributedRevenue).toBe(2500);
            });
        });
    });

    // ── 4. W-Shaped Model ───────────────────────────────────────────────────
    describe('4. W_SHAPED Model', () => {
        it('should assign higher weight to First Touch (35%) and Last Touch (35%)', () => {
            const res = calculateMultiTouchAttribution(dealValue, mockTouchpoints, 'W_SHAPED');
            const googleAds = res.find(r => r.channel === 'Google Ads');
            const direct = res.find(r => r.channel === 'Direct');

            expect(googleAds?.percentage).toBe(35);
            expect(direct?.percentage).toBe(35);
        });
    });

    // ── 5. Time-Decay Model ─────────────────────────────────────────────────
    describe('5. TIME_DECAY Model', () => {
        it('should give more weight to recent touchpoints closer to conversion', () => {
            const res = calculateMultiTouchAttribution(dealValue, mockTouchpoints, 'TIME_DECAY');
            const firstTouch = res.find(r => r.channel === 'Google Ads');
            const lastTouch = res.find(r => r.channel === 'Direct');

            expect(lastTouch?.attributedRevenue).toBeGreaterThan(firstTouch?.attributedRevenue || 0);
        });
    });

    // ── 6. Cohort LTV Calculator ────────────────────────────────────────────
    describe('6. Cohort LTV Calculator', () => {
        it('should calculate historical average LTV and 12-month projected LTV', () => {
            const deals = [
                { dealValue: 5000 },
                { dealValue: 10000 },
                { dealValue: 15000 },
            ];

            const cohort = calculateCohortLTV('2026-01', deals);

            expect(cohort.customerCount).toBe(3);
            expect(cohort.totalRevenue).toBe(30000);
            expect(cohort.avgLtv).toBe(10000);
            expect(cohort.projected12MonthLtv).toBe(16000);
        });

        it('should handle empty cohort gracefully', () => {
            const cohort = calculateCohortLTV('2026-02', []);
            expect(cohort.customerCount).toBe(0);
            expect(cohort.avgLtv).toBe(0);
        });
    });
});
