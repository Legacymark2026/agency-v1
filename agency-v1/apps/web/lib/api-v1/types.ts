/**
 * LegacyMark Public API v1 — Shared Types
 * ────────────────────────────────────────
 * Defines all shared types for the public REST API layer.
 */

// ── API Scopes ─────────────────────────────────────────────────────────────
export const API_SCOPES = {
    // CRM
    LEADS_READ:     "leads:read",
    LEADS_WRITE:    "leads:write",
    LEADS_DELETE:   "leads:delete",
    CONTACTS_READ:  "contacts:read",
    CONTACTS_WRITE: "contacts:write",
    DEALS_READ:     "deals:read",
    DEALS_WRITE:    "deals:write",
    // Inbox
    INBOX_READ:     "inbox:read",
    INBOX_WRITE:    "inbox:write",
    // Marketing
    MARKETING_READ:  "marketing:read",
    MARKETING_WRITE: "marketing:write",
    // Webhooks
    WEBHOOKS_MANAGE: "webhooks:manage",
    // Campaigns
    CAMPAIGNS_READ:  "campaigns:read",
    CAMPAIGNS_WRITE: "campaigns:write",
} as const;

export type ApiScope = typeof API_SCOPES[keyof typeof API_SCOPES];

// ── Rate Limit Config per Plan ─────────────────────────────────────────────
export const RATE_LIMITS: Record<string, { requests: number; windowMs: number }> = {
    free:       { requests: 100,     windowMs: 60 * 60 * 1000 },      // 100/hour
    starter:    { requests: 1_000,   windowMs: 60 * 60 * 1000 },      // 1,000/hour
    growth:     { requests: 5_000,   windowMs: 60 * 60 * 1000 },      // 5,000/hour
    pro:        { requests: 10_000,  windowMs: 60 * 60 * 1000 },      // 10,000/hour
    enterprise: { requests: 100_000, windowMs: 60 * 60 * 1000 },      // 100,000/hour
};

// ── Validated API Key Context ──────────────────────────────────────────────
export interface ApiKeyContext {
    keyId:      string;
    companyId:  string;
    userId:     string;
    scopes:     string[];
    plan:       string;  // subscription tier
}

// ── Standard API Response Envelope ─────────────────────────────────────────
export interface ApiResponse<T = unknown> {
    success: boolean;
    data?:   T;
    error?:  string;
    meta?: {
        page?:       number;
        limit?:      number;
        total?:      number;
        hasMore?:    boolean;
    };
}
