import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';
import { withSentryConfig } from '@sentry/nextjs';

const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

const cspHeader = `
    default-src 'self';
    script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://connect.facebook.net https://static.hotjar.com https://script.hotjar.com https://analytics.tiktok.com;
    style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdnjs.cloudflare.com;
    img-src 'self' blob: data: https: http:;
    font-src 'self' data: https://fonts.gstatic.com;
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'self' https://app.powerbi.com;
    upgrade-insecure-requests;
    connect-src 'self' wss://legacymarksas.com wss://www.legacymarksas.com https://api.stripe.com https://www.google-analytics.com https://analytics.google.com https://www.googletagmanager.com https://connect.facebook.net https://graph.facebook.com https://*.upstash.io https://res.cloudinary.com https://sentry.io https://*.sentry.io https://o4504.ingest.sentry.io https://analytics.tiktok.com https://api.linkedin.com;
    frame-src 'self' https://www.youtube.com https://player.vimeo.com;
`.replace(/\n/g, '');

const nextConfig: NextConfig = {
  output: 'standalone',
  poweredByHeader: false,
  compress: true,
  // CORREGIDO: TypeScript errors deben resolverse, no ignorarse.
  // Los errores activos están documentados en ts_errors.log — resolver progresivamente.
  // typescript: { ignoreBuildErrors: true }, ← ELIMINADO
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
      // ── Canonical domain: strip www ───────────────────────────────────────
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'www.legacymarksas.com' }],
        destination: 'https://legacymarksas.com/:path*',
        permanent: true,
      },
      // ── Force HTTPS (HTTP → HTTPS) ────────────────────────────────────────
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'http://legacymarksas.com' }],
        destination: 'https://legacymarksas.com/:path*',
        permanent: true,
      },
      // ── Locale-less marketing routes → /es (default locale) ──────────────
      {
        source: '/portfolio',
        destination: '/es/portfolio',
        permanent: true,
      },
      {
        source: '/servicios',
        destination: '/es/servicios',
        permanent: true,
      },
      {
        source: '/blog',
        destination: '/es/blog',
        permanent: true,
      },
      {
        source: '/blog/:slug',
        destination: '/es/blog/:slug',
        permanent: true,
      },
      {
        source: '/contacto',
        destination: '/es/contacto',
        permanent: true,
      },
      {
        source: '/nosotros',
        destination: '/es/nosotros',
        permanent: true,
      },
      {
        source: '/soluciones/:path*',
        destination: '/es/soluciones/:path*',
        permanent: true,
      },
      // ── RSS aliases ───────────────────────────────────────────────────────
      // /rss.xml and /feed.xml → /rss (our canonical RSS route)
      {
        source: '/rss.xml',
        destination: '/rss',
        permanent: true,
      },
      {
        source: '/feed.xml',
        destination: '/rss',
        permanent: true,
      },
      {
        source: '/feed',
        destination: '/rss',
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
