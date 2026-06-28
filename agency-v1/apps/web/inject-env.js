/**
 * inject-env.js — Runtime Environment Injection for Next.js Standalone
 *
 * This file is loaded via Node.js --require flag BEFORE any Next.js bundled
 * code executes. It captures the real OS environment variables (injected by
 * Docker Compose at container start) and writes them to a dynamic .env file in
 * the working directory.
 *
 * Why: Next.js standalone in production spawns worker threads and isolated contexts
 * where process.env or globalThis variables can be stripped. By dynamically generating
 * a local .env file on container startup, Next.js naturally loads these variables in
 * all subprocesses, bypasses any build-time Webpack optimizations, and ensures
 * database connections succeed.
 */
const fs = require("fs");
const path = require("path");

const envKeys = [
  "DATABASE_URL",
  "DATABASE_READ_URL",
  "CORE_DATABASE_URL",
  "CORE_DATABASE_READ_URL",
  "AUTH_DATABASE_URL",
  "AUTH_DATABASE_READ_URL",
  "MEDIA_DATABASE_URL",
  "MEDIA_DATABASE_READ_URL",
  "ANALYTICS_DATABASE_URL",
  "ANALYTICS_DATABASE_READ_URL",
  "NODE_ENV",
  "REDIS_URL",
  "API_GATEWAY_URL",
  "VIDEO_SERVICE_URL",
  "NEXTAUTH_URL",
  "NEXTAUTH_SECRET",
  "INTERNAL_SECRET",
  "NODE_EXTRA_CA_CERTS"
];

// Capture dynamic env vars
const envLines = envKeys
  .map(key => {
    const val = process.env[key];
    return val !== undefined ? `${key}="${val}"` : "";
  })
  .filter(Boolean);

// Populate globalThis cache for extra protection in the main thread
globalThis.__DB_ENV__ = {};
envKeys.forEach(key => {
  globalThis.__DB_ENV__[key] = process.env[key];
});

// Write to .env dynamically in the working directory
try {
  const envContent = envLines.join("\n");
  const envPath = path.join(process.cwd(), ".env");
  fs.writeFileSync(envPath, envContent, "utf8");
  process.stderr.write(`[PRISMA-DEBUG] Dynamically generated runtime .env file containing ${envLines.length} variables.\n`);
} catch (err) {
  process.stderr.write(`[PRISMA-DEBUG] Failed to write dynamic .env file: ${err.message}\n`);
}
