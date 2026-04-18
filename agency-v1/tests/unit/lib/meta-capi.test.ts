/**
 * tests/unit/lib/meta-capi.test.ts
 * ──────────────────────────────────────────────────────────────
 * Unit tests for lib/meta-capi.ts
 *
 * Priority: CRITICAL (Security & Compliance)
 *
 * The most important contract guaranteed by these tests:
 *  1. All PII (email, phone, name) MUST be SHA-256 hashed before
 *     reaching the Meta API endpoint. Plaintext PII is a GDPR/
 *     Meta Policy violation.
 *  2. Missing credentials must cause a graceful skip, NOT a crash.
 *  3. Network errors must be caught and returned as structured
 *     error objects, never thrown upward.
 *  4. The QualifiedLead event mapping must be correct.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import crypto from 'crypto';

// ── Helper: compute the expected SHA-256 hash ─────────────────
function expectedHash(value: string): string {
  return crypto
    .createHash('sha256')
    .update(value.trim().toLowerCase())
    .digest('hex');
}

// ── Mock global fetch BEFORE importing the module ────────────
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

// Import AFTER stubbing global fetch
import { sendMetaCapiEvent } from '@/lib/meta-capi';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Credential guard
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
describe('sendMetaCapiEvent() — credential guard', () => {
  beforeEach(() => { mockFetch.mockReset(); });

  it('returns { success: false } when pixelId is missing', async () => {
    const result = await sendMetaCapiEvent({
      pixelId: '',
      accessToken: 'some_token',
      eventName: 'Lead',
      userData: { email: 'test@test.com' },
    });
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/missing credentials/i);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('returns { success: false } when accessToken is missing', async () => {
    const result = await sendMetaCapiEvent({
      pixelId: '123456',
      accessToken: '',
      eventName: 'Lead',
      userData: { email: 'test@test.com' },
    });
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/missing credentials/i);
    expect(mockFetch).not.toHaveBeenCalled();
  });
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// PII Hashing — CRITICAL SECURITY CONTRACT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
describe('sendMetaCapiEvent() — PII hashing contract', () => {
  const credentials = { pixelId: 'PIXEL_123', accessToken: 'TOKEN_ABC' };

  beforeEach(() => {
    mockFetch.mockReset();
    mockFetch.mockResolvedValue({
      ok: true,
      headers: { get: () => 'application/json' },
      json: async () => ({ events_received: 1 }),
    });
  });

  it('NEVER sends plaintext email — must be SHA-256 hashed', async () => {
    const testEmail = 'usuario@legacymarksas.com';

    await sendMetaCapiEvent({
      ...credentials,
      eventName: 'Lead',
      userData: { email: testEmail },
    });

    expect(mockFetch).toHaveBeenCalledOnce();
    const [, options] = mockFetch.mock.calls[0];
    const body = JSON.parse(options.body);
    const sentEmail = body.data[0].user_data.em[0];

    // Must not contain the raw email string
    expect(sentEmail).not.toContain('@');
    expect(sentEmail).not.toBe(testEmail);

    // Must match SHA-256 hash
    expect(sentEmail).toBe(expectedHash(testEmail));
  });

  it('NEVER sends plaintext phone number — must be SHA-256 hashed', async () => {
    const testPhone = '+573001234567';

    await sendMetaCapiEvent({
      ...credentials,
      eventName: 'Lead',
      userData: { phone: testPhone },
    });

    const [, options] = mockFetch.mock.calls[0];
    const body = JSON.parse(options.body);
    const sentPhone = body.data[0].user_data.ph[0];

    expect(sentPhone).not.toBe(testPhone);
    expect(sentPhone).toBe(expectedHash(testPhone));
  });

  it('NEVER sends plaintext first/last name — must be SHA-256 hashed', async () => {
    await sendMetaCapiEvent({
      ...credentials,
      eventName: 'Lead',
      userData: { firstName: 'Carlos', lastName: 'García' },
    });

    const [, options] = mockFetch.mock.calls[0];
    const body = JSON.parse(options.body);
    const { fn, ln } = body.data[0].user_data;

    expect(fn[0]).not.toBe('Carlos');
    expect(fn[0]).toBe(expectedHash('Carlos'));
    expect(ln[0]).not.toBe('García');
    expect(ln[0]).toBe(expectedHash('García'));
  });

  it('sends empty arrays for missing PII fields (not null strings)', async () => {
    await sendMetaCapiEvent({
      ...credentials,
      eventName: 'Contact',
      userData: {}, // No PII provided
    });

    const [, options] = mockFetch.mock.calls[0];
    const body = JSON.parse(options.body);
    const { em, ph, fn, ln } = body.data[0].user_data;

    // Must be empty arrays, not ['null'] or [undefined]
    expect(em).toEqual([]);
    expect(ph).toEqual([]);
    expect(fn).toEqual([]);
    expect(ln).toEqual([]);
  });

  it('converts email to lowercase before hashing (meta requirement)', async () => {
    const upperEmail = 'USUARIO@LEGACYMARKSAS.COM';
    const lowerEmail = 'usuario@legacymarksas.com';

    await sendMetaCapiEvent({
      ...credentials,
      eventName: 'Lead',
      userData: { email: upperEmail },
    });

    const [, options] = mockFetch.mock.calls[0];
    const body = JSON.parse(options.body);
    const sentHash = body.data[0].user_data.em[0];

    // Must hash the lowercase version
    expect(sentHash).toBe(expectedHash(lowerEmail));
  });
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Event name mapping — QualifiedLead → Other
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
describe('sendMetaCapiEvent() — event name mapping', () => {
  const credentials = { pixelId: 'PIXEL_123', accessToken: 'TOKEN_ABC' };

  beforeEach(() => {
    mockFetch.mockReset();
    mockFetch.mockResolvedValue({
      ok: true,
      headers: { get: () => 'application/json' },
      json: async () => ({ events_received: 1 }),
    });
  });

  it('maps QualifiedLead → "Other" in the event_name field', async () => {
    await sendMetaCapiEvent({
      ...credentials,
      eventName: 'QualifiedLead',
      userData: {},
    });

    const [, options] = mockFetch.mock.calls[0];
    const body = JSON.parse(options.body);
    // The official event_name sent to Meta must be "Other"
    expect(body.data[0].event_name).toBe('Other');
    // The custom event name is preserved in custom_data
    expect(body.data[0].custom_data.event_name).toBe('QualifiedLead');
  });

  it('sends "Lead" as-is without remapping', async () => {
    await sendMetaCapiEvent({
      ...credentials,
      eventName: 'Lead',
      userData: {},
    });

    const [, options] = mockFetch.mock.calls[0];
    const body = JSON.parse(options.body);
    expect(body.data[0].event_name).toBe('Lead');
  });

  it('includes test_event_code in payload when provided', async () => {
    await sendMetaCapiEvent({
      ...credentials,
      eventName: 'Lead',
      userData: {},
      testEventCode: 'TEST12345',
    });

    const [, options] = mockFetch.mock.calls[0];
    const body = JSON.parse(options.body);
    expect(body.test_event_code).toBe('TEST12345');
  });
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Network error handling
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
describe('sendMetaCapiEvent() — network error handling', () => {
  const credentials = { pixelId: 'PIXEL_123', accessToken: 'TOKEN_ABC' };

  beforeEach(() => { mockFetch.mockReset(); });

  it('returns { success: false } when fetch throws (network down)', async () => {
    mockFetch.mockRejectedValue(new Error('Network unreachable'));

    const result = await sendMetaCapiEvent({
      ...credentials,
      eventName: 'Lead',
      userData: { email: 'test@test.com' },
    });

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/fetch failed/i);
  });

  it('returns { success: false } on non-OK HTTP response', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 400,
      headers: { get: () => 'application/json' },
      json: async () => ({ error: { message: 'Invalid pixel ID' } }),
    });

    const result = await sendMetaCapiEvent({
      ...credentials,
      eventName: 'Lead',
      userData: {},
    });

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/invalid pixel id/i);
  });

  it('returns { success: true } on successful response', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      headers: { get: () => 'application/json' },
      json: async () => ({ events_received: 1, fbtrace_id: 'abc123' }),
    });

    const result = await sendMetaCapiEvent({
      ...credentials,
      eventName: 'Lead',
      userData: { email: 'test@example.com' },
    });

    expect(result.success).toBe(true);
    expect(result.result).toBeDefined();
  });
});
