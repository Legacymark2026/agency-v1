/**
 * Analytics Service — Business Intelligence & Telemetry Microservice
 * ─────────────────────────────────────────────────────────────────────────────
 * Handles: User Activity Logs, Metered Usage Aggregation, Sales Forecasting, BI
 * Port: 4013 (HTTP)
 *
 * Fixes applied in this refactor:
 *   C-1: requireUserOrServiceAuth enforced across all business and telemetry routes
 *   C-2: Strict multi-tenant isolation on logs, metered billing & predictive sales
 *   C-3: Singleton Redis client in lib/redis.singleton.ts with graceful disconnect
 *   C-4: Resilient partition management with proper error boundaries
 *   A-1 & A-2: Refactored into modular domain routers
 */
declare const _default: any;
export default _default;
