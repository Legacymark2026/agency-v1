/**
 * tests/setup.ts
 * ──────────────────────────────────────────────────────────────
 * Vitest global setup file.
 * Runs before every test file in the suite.
 */
import '@testing-library/jest-dom';
import { vi, beforeAll, afterAll, afterEach } from 'vitest';

// ── Silence console noise in test output ──────────────────────
// Keep error output clean. Individual tests can spy on console if needed.
beforeAll(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});

afterAll(() => {
  vi.restoreAllMocks();
});

// ── Reset mocks between tests ─────────────────────────────────
// Prevents state leaking between test cases
afterEach(() => {
  vi.clearAllMocks();
});
