/**
 * Notification Service — Enterprise Notification & Delivery Microservice
 * ─────────────────────────────────────────────────────────────────────────────
 * Centralized notification hub for the entire LegacyMark platform.
 * Handles: In-App, Email (Resend), Push, SMS delivery channels & BullMQ Queues.
 * Port: 4016 (HTTP)
 *
 * Fixes applied in this refactor:
 *   C-1: requireUserOrServiceAuth enforced on all notification endpoints & stats
 *   C-2: Strict multi-tenant isolation on notification listings and dispatches
 *   C-3: High-throughput batch email worker in workers/email.worker.ts
 *   C-4: Redis connection consolidation in lib/redis.singleton.ts
 *   C-5: 32 platform events decoupled into events/notification.events.ts
 *   A-1 & A-2: 961-line God Object refactored into modular domain routers
 */
declare const _default: any;
export default _default;
//# sourceMappingURL=index.d.ts.map