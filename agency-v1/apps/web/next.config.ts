import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';
import { withSentryConfig } from '@sentry/nextjs';

const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

const cspHeader = `
    default-src 'self';
    script-src 'self' 'unsafe-eval' 'unsafe-inline' https: http:;
    style-src 'self' 'unsafe-inline';
    img-src 'self' blob: data: https: http:;
    font-src 'self' data: https: http:;
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'self' https://app.powerbi.com;
    upgrade-insecure-requests;
    connect-src 'self' wss: https: http:;
    frame-src 'self' https: http:;
`.replace(/\n/g, '');

const nextConfig: NextConfig = {
  poweredByHeader: false,
  compress: true,
  typescript: { ignoreBuildErrors: true },
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      'framer-motion',
      'date-fns',
      'clsx',
      'tailwind-merge',
      '@radix-ui/react-accordion',
      '@radix-ui/react-avatar',
      '@radix-ui/react-checkbox',
      '@radix-ui/react-context-menu',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-label',
      '@radix-ui/react-popover',
      '@radix-ui/react-progress',
      '@radix-ui/react-scroll-area',
      '@radix-ui/react-select',
      '@radix-ui/react-slider',
      '@radix-ui/react-slot',
      '@radix-ui/react-switch',
      '@radix-ui/react-tabs',
      '@radix-ui/react-tooltip',
    ],
  },
  async redirects() {
    return [
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'www.legacymarksas.com' }],
        destination: 'https://legacymarksas.com/:path*',
        permanent: true,
      },
    ];
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Content-Security-Policy', value: cspHeader },
        ]
      }
    ];
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      { protocol: 'https', hostname: 'ui-avatars.com' },
      { protocol: 'https', hostname: 'graph.facebook.com' },
      { protocol: 'https', hostname: 'platform-lookaside.fbsbx.com' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'avatar.vercel.sh' },
    ],
  },
};

// ── Sentry Configuration ─────────────────────────────────────────────────────
// withSentryConfig wraps the Next.js config to:
//  1. Auto-upload source maps to Sentry on build (for readable stack traces)
//  2. Instrument Server Actions, API Routes and Middleware automatically
//  3. Tree-shake Sentry from client-side bundle when DSN is not provided
export default withSentryConfig(
  withNextIntl(nextConfig),
  {
    // ── Sentry Organization & Project ──────────────────────
    org: process.env.SENTRY_ORG,
    project: process.env.SENTRY_PROJECT || 'agency-v1',

    // ── Silent mode: suppress build output noise ───────────
    silent: !process.env.CI,

    // ── Source Maps ────────────────────────────────────────
    // Upload source maps to Sentry so production stack traces
    // point to original TypeScript code, not minified JS.
    sourcemaps: {
      deleteSourcemapsAfterUpload: true, // Don't ship maps to clients
    },

    // ── Automatic Instrumentation ──────────────────────────
    // Note: Some of these options require webpack explicitly in recent SDKs
    webpack: {
      autoInstrumentServerFunctions: true,
      autoInstrumentMiddleware: true,
      autoInstrumentAppDirectory: true,
      treeshake: {
        removeDebugLogging: true
      }
    },

    // ── Tunneling (bypass ad-blockers for error reports) ───
    tunnelRoute: '/monitoring-tunnel',
  }
);
