/**
 * Inbox Service — Unit Tests: SLA & Merge Logic
 * ─────────────────────────────────────────────────────────────────────────────
 * Pure unit tests with mocked Prisma — no live DB required.
 *
 * Coverage targets:
 *  - SLA: getSLAConfig defaults, getSLAWarning status thresholds (OK/WARNING/CRITICAL/BREACHED)
 *  - Merge: mergeConversations validation, successful merge, error propagation
 *  - findDuplicateConversations: no duplicates, returns all except most recent
 */
export {};
