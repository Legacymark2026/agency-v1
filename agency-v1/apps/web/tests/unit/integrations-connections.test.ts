/**
 * apps/web/tests/unit/integrations-connections.test.ts
 * ──────────────────────────────────────────────────────────────
 * Unit test suite verifying connection testing, credential validation,
 * and error handling contracts for all platform integrations.
 *
 * Priority: CRITICAL (Integrations, Health Checks & Reliability)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Mock Prisma database client before module imports ────────
vi.mock('@/lib/prisma', () => ({
    prisma: {
        integrationConfig: {
            findUnique: vi.fn().mockResolvedValue(null),
            findFirst: vi.fn().mockResolvedValue(null),
        }
    }
}));

// Stub global fetch for mocking API responses
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

// Import integrations
import { sendMetaCapiEvent } from '@/lib/meta-capi';
import { sendTiktokCapiEvent } from '@/lib/tiktok-capi';
import { sendLinkedinCapiEvent } from '@/lib/linkedin-capi';
import { sendSlackMessage, sendDiscordMessage, makeHttpRequest } from '@/lib/integrations';
import { rateLimit } from '@/lib/rate-limit';

describe('Integrations Connection & Credential Verification Tests', () => {
    beforeEach(() => {
        mockFetch.mockReset();
    });

    // ── 1. Meta Ads & CAPI ───────────────────────────────────────────────────
    describe('1. Meta Ads & CAPI Integration', () => {
        it('should fail connection test gracefully when credentials are invalid/missing', async () => {
            const res = await sendMetaCapiEvent({
                pixelId: '',
                accessToken: '',
                eventName: 'Lead',
                userData: { email: 'test@example.com' }
            });
            expect(res.success).toBe(false);
            expect(res.error).toMatch(/missing credentials/i);
            expect(mockFetch).not.toHaveBeenCalled();
        });

        it('should pass connection test when Meta Graph API returns HTTP 200', async () => {
            mockFetch.mockResolvedValueOnce(
                new Response(JSON.stringify({ events_received: 1, fbtrace_id: 'meta_test_trace' }), {
                    status: 200,
                    headers: { 'Content-Type': 'application/json' }
                })
            );

            const res = await sendMetaCapiEvent({
                pixelId: '123456789',
                accessToken: 'EAA_mock_token',
                eventName: 'Lead',
                userData: { email: 'test@example.com' }
            });

            expect(res.success).toBe(true);
            expect(mockFetch).toHaveBeenCalledWith(
                expect.stringContaining('graph.facebook.com'),
                expect.objectContaining({ method: 'POST' })
            );
        });
    });

    // ── 2. TikTok Ads & CAPI ────────────────────────────────────────────────
    describe('2. TikTok Ads & CAPI Integration', () => {
        it('should return null gracefully when TikTok config is missing in DB', async () => {
            const res = await sendTiktokCapiEvent('non_existent_company', {
                eventName: 'Subscribe',
                userData: { email: 'user@example.com' }
            });
            expect(res).toBeNull();
        });
    });

    // ── 3. LinkedIn Ads & CAPI ──────────────────────────────────────────────
    describe('3. LinkedIn Ads & CAPI Integration', () => {
        it('should return null gracefully when LinkedIn config is missing in DB', async () => {
            const res = await sendLinkedinCapiEvent('non_existent_company', {
                conversionInfo: { currencyCode: 'USD', amount: 100 },
                userData: { email: 'lead@b2bcompany.com' }
            });
            expect(res).toBeNull();
        });
    });

    // ── 4. Slack & Discord Webhooks ──────────────────────────────────────────
    describe('4. Slack & Discord Webhook Integrations', () => {
        it('should deliver Slack webhook payload correctly on HTTP 200', async () => {
            mockFetch.mockResolvedValueOnce(new Response('ok', { status: 200 }));

            const success = await sendSlackMessage('https://hooks.slack.com/services/T00/B00/X00', 'Test alert');
            expect(success).toBe(true);
            expect(mockFetch).toHaveBeenCalledWith(
                'https://hooks.slack.com/services/T00/B00/X00',
                expect.objectContaining({
                    method: 'POST',
                    body: JSON.stringify({ text: 'Test alert' })
                })
            );
        });

        it('should deliver Discord webhook payload correctly on HTTP 200', async () => {
            mockFetch.mockResolvedValueOnce(new Response(JSON.stringify({ message: 'delivered' }), { status: 200 }));

            const success = await sendDiscordMessage('https://discord.com/api/webhooks/123/abc', 'Test discord message');
            expect(success).toBe(true);
        });
    });

    // ── 5. Generic HTTP Webhook Connection Test ─────────────────────────────
    describe('5. Generic HTTP Webhook & API Connection Test', () => {
        it('should handle non-JSON responses and 404 status codes without crashing', async () => {
            mockFetch.mockResolvedValueOnce(new Response('Not Found', { status: 404 }));

            const res = await makeHttpRequest('https://api.external.com/health', 'GET');
            expect(res.success).toBe(false);
            expect(res.status).toBe(404);
        });
    });

    // ── 6. Upstash Redis Rate Limiter Connection Test ────────────────────────
    describe('6. Upstash Redis Service Connection Test', () => {
        it('should perform graceful fail-open when Upstash Redis connection fails', async () => {
            mockFetch.mockRejectedValueOnce(new Error('Connection refused'));

            const allowed = await rateLimit('test-ip-123', 10, 60_000);
            expect(allowed).toBe(true); // Fail-open resilience guarantee
        });
    });
});
