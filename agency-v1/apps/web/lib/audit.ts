/**
 * Real Production Audit Trail Logger (PostgreSQL + Prisma)
 * ─────────────────────────────────────────────────────────────────────────────
 * Writes real, persistent user and AI activity logs directly to PostgreSQL
 * with automated secret sanitization and log redaction.
 */

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export type AuditAction =
  | "auth.login"
  | "auth.logout"
  | "auth.mfa_enable"
  | "auth.mfa_disable"
  | "user.create"
  | "user.update"
  | "invoice.create"
  | "invoice.dian_sync"
  | "lead.create"
  | "lead.update"
  | "deal.create"
  | "ai.agent_execution"
  | "webhook.dispatch";

export interface AuditContext {
  action: AuditAction;
  outcome: "success" | "failure" | "blocked";
  details?: Record<string, unknown>;
}

const SENSITIVE_KEYS = new Set([
  "password",
  "token",
  "secret",
  "apikey",
  "api_key",
  "accesstoken",
  "access_token",
  "refreshtoken",
  "refresh_token",
  "authorization",
  "creditcard",
  "cardnumber",
  "cvv",
  "pin",
]);

function sanitizePayload(payload: any): any {
  if (!payload || typeof payload !== "object") return payload;
  if (Array.isArray(payload)) return payload.map(sanitizePayload);

  const clean: Record<string, any> = {};
  for (const [key, value] of Object.entries(payload)) {
    const lowerKey = key.toLowerCase();
    if (SENSITIVE_KEYS.has(lowerKey) || lowerKey.includes("password") || lowerKey.includes("secret")) {
      clean[key] = "[REDACTED]";
    } else if (typeof value === "object" && value !== null) {
      clean[key] = sanitizePayload(value);
    } else {
      clean[key] = value;
    }
  }
  return clean;
}

export async function audit(ctx: AuditContext): Promise<string> {
  let userId = "system";
  try {
    const session = await auth();
    if (session?.user?.id) userId = session.user.id;
  } catch (_) {
    // Graceful fallback outside HTTP request context
  }

  const cleanDetails = sanitizePayload(ctx.details || {});

  try {
    const entry = await prisma.userActivityLog.create({
      data: {
        userId,
        action: ctx.action,
        details: JSON.stringify({
          outcome: ctx.outcome,
          timestamp: new Date().toISOString(),
          details: cleanDetails,
        }),
      },
    });

    return entry.id;
  } catch (error) {
    console.error("[Audit] Failed to log to PostgreSQL:", error);
    return "";
  }
}

export async function getAuditLogs(limit: number = 50) {
  return prisma.userActivityLog.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}