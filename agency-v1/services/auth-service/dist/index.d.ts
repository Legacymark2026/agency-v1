/**
 * Auth Service — Identity & Access Management Microservice
 * ─────────────────────────────────────────────────────────────────────────────
 * Handles: Authentication, Authorization, RBAC, MFA, Sessions, API Keys, JWKS
 * Port: 4001 (HTTP) | Port: 50051 (gRPC Sync)
 *
 * Fixes applied in this refactor:
 *   C-1: Keystore initialized deterministically via lib/keys.ts (no race conditions)
 *   C-2: Unification of authentication handlers into dedicated domain routers
 *   C-3: Strict multi-tenant boundaries on roles, permissions & users
 *   C-4: Zod whitelisting preventing mass-assignment and privilege escalation
 *   C-5: Shared EventBus and Redis singleton client
 *   A-1 & A-2: 980-line God Object refactored into modular domain routers
 */
declare const _default: any;
export default _default;
