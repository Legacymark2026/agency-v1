/**
 * lib/inbox/audit.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Audit Logging for Compliance (P0 #3)
 *
 * Comprehensive audit trail for all inbox actions
 * - Tracks who, what, when, where
 * - Stores before/after values for changes
 * - Supports immutable audit logs (2 year retention)
 * - Enables compliance reports and investigations
 */

import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import type { User } from "@prisma/client";

export type InboxAuditAction =
  | "message_sent"
  | "message_deleted"
  | "status_changed"
  | "assigned_to_changed"
  | "macro_executed"
  | "tag_added"
  | "tag_removed"
  | "priority_changed"
  | "thread_merged"
  | "sla_breached"
  | "draft_created"
  | "draft_approved";

/**
 * Registra un evento de auditoría
 */
export async function logAuditEvent(
  action: InboxAuditAction,
  {
    conversationId,
    companyId,
    userId,
    resourceType,
    resourceId,
    oldValue,
    newValue,
    ipAddress,
    userAgent,
    metadata = {},
  }: {
    conversationId?: string;
    companyId: string;
    userId?: string;
    resourceType: "conversation" | "message" | "macro" | "draft";
    resourceId: string;
    oldValue?: any;
    newValue?: any;
    ipAddress?: string;
    userAgent?: string;
    metadata?: Record<string, any>;
  }
): Promise<void> {
  try {
    await prisma.inboxAuditLog.create({
      data: {
        conversationId,
        companyId,
        userId,
        action,
        resourceType,
        resourceId,
        oldValue: oldValue ? JSON.parse(JSON.stringify(oldValue)) : null,
        newValue: newValue ? JSON.parse(JSON.stringify(newValue)) : null,
        ipAddress,
        userAgent,
        metadata: JSON.parse(JSON.stringify(metadata)),
      },
    });

    logger.debug("[Audit] Event logged", {
      action,
      conversationId,
      resourceId,
    });
  } catch (error) {
    logger.error("[Audit] Error logging event", {
      action,
      error: error instanceof Error ? error.message : String(error),
    });
    // No throw - no bloquear operaciones por fallo de auditoría
  }
}

/**
 * Obtiene histórico de auditoría para una conversación
 */
export async function getAuditTrail(
  conversationId: string,
  limit: number = 100
) {
  try {
    const logs = await prisma.inboxAuditLog.findMany({
      where: { conversationId },
      orderBy: { createdAt: "desc" },
      take: limit,
      include: {
        user: { select: { id: true, name: true, email: true } },
        company: { select: { id: true, name: true } },
      },
    });

    return logs.map(log => ({
      ...log,
      timestamp: log.createdAt,
      actor: log.user?.name || log.user?.email || "System",
    }));
  } catch (error) {
    logger.error("[Audit] Error getting audit trail", {
      conversationId,
      error: error instanceof Error ? error.message : String(error),
    });
    return [];
  }
}

/**
 * Busca eventos de auditoría por filtros
 */
export async function searchAuditLogs(
  companyId: string,
  filters: {
    action?: InboxAuditAction;
    userId?: string;
    resourceType?: string;
    resourceId?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  }
) {
  try {
    const { action, userId, resourceType, resourceId, startDate, endDate, limit = 100 } =
      filters;

    const logs = await prisma.inboxAuditLog.findMany({
      where: {
        companyId,
        ...(action && { action }),
        ...(userId && { userId }),
        ...(resourceType && { resourceType }),
        ...(resourceId && { resourceId }),
        ...(startDate && { createdAt: { gte: startDate } }),
        ...(endDate && { createdAt: { lte: endDate } }),
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });

    return logs;
  } catch (error) {
    logger.error("[Audit] Error searching audit logs", {
      companyId,
      error: error instanceof Error ? error.message : String(error),
    });
    return [];
  }
}

/**
 * Expone datos de auditoría con formato para compliance reports
 */
export async function generateAuditReport(
  companyId: string,
  startDate: Date,
  endDate: Date
) {
  try {
    const logs = await prisma.inboxAuditLog.findMany({
      where: {
        companyId,
        createdAt: { gte: startDate, lte: endDate },
      },
      orderBy: { createdAt: "asc" },
      include: {
        user: { select: { name: true, email: true } },
        conversation: { select: { id: true, channel: true } },
      },
    });

    // Aggregate statistics
    const actionCounts = logs.reduce((acc, log) => {
      acc[log.action] = (acc[log.action] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const userActivity = logs.reduce((acc, log) => {
      const key = log.user?.email || "System";
      if (!acc[key]) acc[key] = { count: 0, actions: [] };
      acc[key].count++;
      acc[key].actions.push(log.action);
      return acc;
    }, {} as Record<string, any>);

    return {
      period: { startDate, endDate },
      totalEvents: logs.length,
      actionCounts,
      userActivity,
      logs: logs.map(log => ({
        timestamp: log.createdAt.toISOString(),
        actor: log.user?.email || "System",
        action: log.action,
        resource: `${log.resourceType}:${log.resourceId}`,
        conversation: log.conversation?.id,
        changes: log.oldValue && log.newValue ? {
          from: log.oldValue,
          to: log.newValue,
        } : null,
      })),
    };
  } catch (error) {
    logger.error("[Audit] Error generating report", {
      companyId,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

/**
 * Helper: Log message sent
 */
export async function auditMessageSent(
  conversationId: string,
  messageId: string,
  companyId: string,
  userId: string,
  metadata?: Record<string, any>
) {
  return logAuditEvent("message_sent", {
    conversationId,
    companyId,
    userId,
    resourceType: "message",
    resourceId: messageId,
    newValue: { status: "SENT" },
    metadata,
  });
}

/**
 * Helper: Log status change
 */
export async function auditStatusChanged(
  conversationId: string,
  companyId: string,
  userId: string,
  oldStatus: string,
  newStatus: string
) {
  return logAuditEvent("status_changed", {
    conversationId,
    companyId,
    userId,
    resourceType: "conversation",
    resourceId: conversationId,
    oldValue: { status: oldStatus },
    newValue: { status: newStatus },
  });
}

/**
 * Helper: Log assignment change
 */
export async function auditAssignmentChanged(
  conversationId: string,
  companyId: string,
  userId: string,
  oldAssignedTo: string | null,
  newAssignedTo: string | null
) {
  return logAuditEvent("assigned_to_changed", {
    conversationId,
    companyId,
    userId,
    resourceType: "conversation",
    resourceId: conversationId,
    oldValue: { assignedTo: oldAssignedTo },
    newValue: { assignedTo: newAssignedTo },
  });
}
