/**
 * Auth Service — Identity & Access Management Microservice
 * ─────────────────────────────────────────────────────────────────────────────
 * Handles: Authentication, Authorization, RBAC, MFA, Sessions, API Keys
 * Port: 4001
 *
 * DB routing (via @agency/database proxy):
 *   - User, Session, Account, Role, Permission, RoleConfig, ApiKey → AUTH DB
 *   - CompanyUser → CORE DB (soft-linked by userId)
 *   - UserActivityLog → ANALYTICS DB
 */
declare const _default: any;
export default _default;
