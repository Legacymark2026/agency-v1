/**
 * Real Production Audit Trail Logger (PostgreSQL + Prisma)
 * ─────────────────────────────────────────────────────────────────────────────
 * Writes real, persistent user and AI activity logs directly to PostgreSQL
 * with automated secret sanitization and log redaction.
 */

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { secretSanitizer } from "../../../packages/observability/src/secret-sanitizer";

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

export async function audit(ctx: AuditContext): Promise<string> {
  let userId = "system";
  try {
    const session = await auth();
    if (session?.user?.id) userId = session.user.id;
  } catch (_) {
    // Graceful fallback outside HTTP request context
  }

  const cleanDetails = secretSanitizer.sanitizePayload(ctx.details || {});

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