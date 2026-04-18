import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

/**
 * Vitest Configuration — LegacyMark Agency V1
 * ─────────────────────────────────────────────
 * - Uses vite-tsconfig-paths to resolve @/* aliases from tsconfig.json
 * - Coverage enforced at 80% for critical security libraries
 * - Node environment for server-side lib tests
 * - jsdom available per-test via @vitest/environment-jsdom
 */
export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      reportsDirectory: './coverage',
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 75,
        statements: 80,
      },
      include: [
        'lib/rbac.ts',
        'lib/guard.ts',
        'lib/security.ts',
        'lib/meta-capi.ts',
        'lib/rate-limit.ts',
        'lib/errors.ts',
      ],
      exclude: [
        'node_modules/**',
        '.next/**',
        'coverage/**',
        'cypress/**',
        'tests/**',
        '**/*.d.ts',
        '**/*.config.*',
      ],
    },
      exclude: [
        'node_modules/**',
        '.next/**',
        'coverage/**',
        'cypress/**',
        'dist/**',
        // This file uses node:test runner (not Vitest) — runs separately
        'tests/email-templates.test.ts',
      ],
    // Timeout generoso para tests con DB mocks
    testTimeout: 10_000,
    // Mostrar tests individuales, no solo el resumen
    reporters: ['verbose'],
  },
});
