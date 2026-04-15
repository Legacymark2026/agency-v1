"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export type AuditAction =
  | "STATUS_CHANGE"
  | "PRIORITY_CHANGE"
  | "ASSIGNEE_CHANGE"
  | "POSITION_CHANGE"
  | "TITLE_CHANGE"
  | "DESCRIPTION_CHANGE"
  | "DUE_DATE_CHANGE"
  | "LABEL_CHANGE"
  | "STORY_POINTS_CHANGE"
  | "TASK_CREATED"
  | "TASK_ARCHIVED"
  | "COMMENT_ADDED"
  | "SUBTASK_ADDED"
  | "APPROVAL_SENT";

/** Called internally from kanban-tasks.ts after any state change */
export async function logAuditEvent(
  taskId: string,
  actorId: string,
  action: AuditAction,
  fromValue?: string,
  toValue?: string,
  metadata?: Record<string, any>
) {
  try {
    await (prisma as any).kanbanAuditLog.create({
      data: { taskId, actorId, action, fromValue, toValue, metadata },
    });
  } catch {
    // Non-blocking — never crash the main operation for audit failure
  }
}

/** Full audit log for a single task */
export async function getTaskAuditLog(taskId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, data: [] };

    const logs = await (prisma as any).kanbanAuditLog.findMany({
      where: { taskId },
      include: {
        actor: { select: { id: true, name: true, image: true, email: true, firstName: true, lastName: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return { success: true, data: logs };
  } catch (err: any) {
    return { success: false, data: [], error: err.message };
  }
}

/** Project-level audit log (all tasks) */
export async function getProjectAuditLog(projectId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, data: [] };

    const logs = await (prisma as any).kanbanAuditLog.findMany({
      where: { task: { projectId } },
      include: {
        actor: { select: { id: true, name: true, image: true, firstName: true, lastName: true } },
        task: { select: { id: true, title: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    });

    return { success: true, data: logs };
  } catch (err: any) {
    return { success: false, data: [], error: err.message };
  }
}

/** SLA Monitoring — return tasks that have exceeded their SLA deadline */
export async function getSlaBreaches(projectId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, data: [] };

    const now = new Date();

    const tasks = await prisma.kanbanTask.findMany({
      where: {
        projectId,
        archived: false,
        status: { notIn: ["DONE", "ARCHIVED"] },
        OR: [
          // Custom SLA deadline exceeded
          { slaDeadline: { lt: now } } as any,
          // Tasks in IN_PROGRESS for >24h with no SLA set
          {
            status: "IN_PROGRESS",
            slaDeadline: null,
            updatedAt: { lt: new Date(now.getTime() - 24 * 60 * 60 * 1000) },
          },
        ],
      },
      select: {
        id: true, title: true, status: true, priority: true,
        slaDeadline: true, updatedAt: true,
        assignee: { select: { id: true, name: true, image: true, firstName: true, lastName: true } },
      } as any,
      orderBy: { updatedAt: "asc" },
    });

    return { success: true, data: tasks };
  } catch (err: any) {
    return { success: false, data: [], error: err.message };
  }
}
