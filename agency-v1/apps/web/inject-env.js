/**
 * inject-env.js — Runtime Environment Injection for Next.js Standalone
 *
 * This file is loaded via Node.js --require flag BEFORE any Next.js bundled
 * code executes. It captures the real OS environment variables (injected by
 * Docker Compose at container start) and stores them in globalThis.__DB_ENV__.
 *
 * Why: Next.js Turbopack/Webpack replaces `process.env.X` with static values
 * at build time. During Docker build, database env vars are undefined, so the
 * bundled code gets `undefined` inlined. This script bypasses that entirely by
 * reading the real `process.env` before any bundled code runs and storing the
 * values in a globalThis property that the bundler cannot optimize away.
 */
globalThis.__DB_ENV__ = {
  DATABASE_URL: process.env.DATABASE_URL,
  DATABASE_READ_URL: process.env.DATABASE_READ_URL,
  CORE_DATABASE_URL: process.env.CORE_DATABASE_URL,
  CORE_DATABASE_READ_URL: process.env.CORE_DATABASE_READ_URL,
  AUTH_DATABASE_URL: process.env.AUTH_DATABASE_URL,
  AUTH_DATABASE_READ_URL: process.env.AUTH_DATABASE_READ_URL,
  MEDIA_DATABASE_URL: process.env.MEDIA_DATABASE_URL,
  MEDIA_DATABASE_READ_URL: process.env.MEDIA_DATABASE_READ_URL,
  ANALYTICS_DATABASE_URL: process.env.ANALYTICS_DATABASE_URL,
  ANALYTICS_DATABASE_READ_URL: process.env.ANALYTICS_DATABASE_READ_URL,
  NODE_ENV: process.env.NODE_ENV,
};
