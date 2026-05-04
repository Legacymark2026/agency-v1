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

// Server Actions
export * from "@/actions/inbox-advanced";
