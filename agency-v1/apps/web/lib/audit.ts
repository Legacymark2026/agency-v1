/**
 * lib/audit.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Sistema centralizado de Audit Logs.
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
  | "lead.create"
  | "lead.update"
  | "deal.create";

export interface AuditContext {
  action: AuditAction;
  outcome: "success" | "failure" | "blocked";
  details?: Record<string, unknown>;
}

export async function audit(ctx: AuditContext): Promise<string> {
  try {
    const session = await auth();
    const userId = session?.user?.id || "anonymous";

    const entry = await prisma.userActivityLog.create({
      data: {
        userId,
        action: ctx.action,
        details: JSON.stringify({
          outcome: ctx.outcome,
          details: ctx.details,
        }),
      },
    });

    return entry.id;
  } catch (error) {
    console.error("[Audit] Failed to log:", error);
    return "";
  }
}

export async function getAuditLogs(limit: number = 50) {
  return prisma.userActivityLog.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}