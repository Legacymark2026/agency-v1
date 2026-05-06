/**
 * lib/inbox/index.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Barrel export para todas las utilidades de inbox avanzado
 */

// Threading
export * from "./threading";

// SLA Tracking
export * from "./sla";

// Audit Logging
export * from "./audit";

// Email Templates
export * from "./templates";

// Webhooks
export * from "./webhooks";

// Conversation Merge
export * from "./merge";

// NOTE: Server actions (inbox-advanced) are intentionally NOT re-exported here
// to avoid circular dependencies (lib/inbox/* ← inbox-advanced ← lib/inbox/index).
// Import directly from '@/actions/inbox-advanced' where needed.;
