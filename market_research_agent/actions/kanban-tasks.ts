"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { randomBytes } from "crypto";

const REVALIDATE = () => revalidatePath("/dashboard/admin/operations/kanban");

async function requireAuth() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  return session.user;
}

// ── CREATE TASK ──────────────────────────────────────────────────────────────
export async function createKanbanTask(data: {
  title: string; description?: string; priority?: string; status?: string;
  assigneeId?: string | null; estimatedHours?: number; dueDate?: Date;
  labels?: string[]; swimlaneId?: string; projectId: string;
  storyPoints?: number | null;
  budgetCap?: number | null; costPerHour?: number | null; slaDeadline?: Date | null;
}) {
  try {
    const user = await requireAuth();
    const { projectId, swimlaneId, labels, storyPoints, ...rest } = data;

    let targetProjectId = projectId;
    if (targetProjectId === "default") {
      const first = await prisma.kanbanProject.findFirst({});
      if (!first) return { success: false, error: "No projects exist." };
      targetProjectId = first.id;
    }

    let targetSwimlaneId = swimlaneId;
    if (!targetSwimlaneId) {
      let sl = await prisma.kanbanSwimlane.findFirst({ where: { projectId: targetProjectId }, orderBy: { order: "asc" } });
      if (!sl) {
        sl = await prisma.kanbanSwimlane.create({ data: { name: "Backlog", projectId: targetProjectId, order: 0 } });
      }
      targetSwimlaneId = sl.id;
    }

    const maxOrder = await prisma.kanbanTask.count({ where: { swimlaneId: targetSwimlaneId, status: rest.status || "TODO" } });

    const task = await prisma.kanbanTask.create({
      data: {
        title: rest.title,
        description: rest.description,
        priority: rest.priority || "MEDIUM",
        status: rest.status || "TODO",
        estimatedHours: rest.estimatedHours,
        assigneeId: rest.assigneeId || user.id,
        dueDate: rest.dueDate,
        projectId: targetProjectId,
        swimlaneId: targetSwimlaneId,
        creatorId: user.id,
        order: maxOrder,
        // New fields — only included if migration has run (Prisma client handles this gracefully)
        ...(labels !== undefined ? { labels } : {}),
        ...(storyPoints !== undefined ? { storyPoints } : {}),
        ...(data.budgetCap !== undefined ? { budgetCap: data.budgetCap } : {}),
        ...(data.costPerHour !== undefined ? { costPerHour: data.costPerHour } : {}),
        ...(data.slaDeadline !== undefined ? { slaDeadline: data.slaDeadline } : {}),
      } as any, // 'as any' bridges pre/post migration type gap
    });

    REVALIDATE();
    return { success: true, task };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to create task" };
  }
}

// ── GET BOARD DATA ───────────────────────────────────────────────────────────
export async function getKanbanBoardData(projectId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };

    const targetProjectId = projectId === "default"
      ? (await prisma.kanbanProject.findFirst({}))?.id : projectId;
    if (!targetProjectId) return { success: false, error: "No projects found" };

    const project = await prisma.kanbanProject.findUnique({
      where: { id: targetProjectId },
      include: {
        swimlanes: {
          orderBy: { order: "asc" },
          include: {
            kanbanTasks: {
              orderBy: { order: "asc" },
              // Safe explicit select — only columns that exist BEFORE migration
              select: {
                id: true,
                title: true,
                description: true,
                status: true,
                priority: true,
                order: true,
                projectId: true,
                assigneeId: true,
                creatorId: true,
                dueDate: true,
                estimatedHours: true,
                swimlaneId: true,
                createdAt: true,
                updatedAt: true,
                assignee: {
                  select: {
                    id: true, name: true, image: true,
                    email: true, firstName: true, lastName: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!project) return { success: false, error: "Project not found" };
    return { success: true, project };
  } catch (err: any) {
    console.error("[getKanbanBoardData]", err?.message);
    return { success: false, error: "Internal Error" };
  }
}

// ── GET ALL PROJECTS ─────────────────────────────────────────────────────────
export async function getKanbanProjects() {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, projects: [] };
    const projects = await prisma.kanbanProject.findMany({
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { swimlanes: true } } },
    });
    return { success: true, projects };
  } catch (err: any) {
    return { success: false, projects: [] };
  }
}

// ── UPDATE TASK POSITION ─────────────────────────────────────────────────────
export async function updateTaskPosition(taskId: string, newSwimlaneId: string, newStatus: string, newOrder: number) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };
    await prisma.kanbanTask.update({ where: { id: taskId }, data: { swimlaneId: newSwimlaneId, status: newStatus, order: newOrder } });
    REVALIDATE();
    return { success: true };
  } catch (err: any) {
    return { success: false, error: "Failed to update position" };
  }
}

// ── UPDATE TASK DETAILS ──────────────────────────────────────────────────────
export async function updateTaskDetails(taskId: string, data: any) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };
    const task = await prisma.kanbanTask.update({ where: { id: taskId }, data });
    REVALIDATE();
    return { success: true, task };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to update task" };
  }
}

// ── DELETE TASK ──────────────────────────────────────────────────────────────
export async function deleteKanbanTask(taskId: string) {
  try {
    await requireAuth();
    await prisma.kanbanTask.delete({ where: { id: taskId } });
    REVALIDATE();
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// ── GET TASK DETAIL ──────────────────────────────────────────────────────────
export async function getKanbanTaskDetail(taskId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, task: null };

    const task = await prisma.kanbanTask.findUnique({
      where: { id: taskId },
      include: {
        assignee: { select: { id: true, name: true, image: true, email: true, firstName: true, lastName: true } },
        creator: { select: { id: true, name: true, image: true, firstName: true, lastName: true } },
        comments: {
          orderBy: { createdAt: "asc" },
          include: { author: { select: { id: true, name: true, image: true, firstName: true, lastName: true } } },
        },
        subtasks: { orderBy: { order: "asc" } },
      },
    } as any);

    if (!task) return { success: false, task: null };
    return { success: true, task };
  } catch (err: any) {
    return { success: false, task: null };
  }
}

// ── ADD COMMENT ──────────────────────────────────────────────────────────────
export async function addKanbanComment(taskId: string, content: string) {
  try {
    const user = await requireAuth();
    const comment = await (prisma as any).kanbanComment.create({
      data: { taskId, content, authorId: user.id },
      include: { author: { select: { id: true, name: true, image: true, firstName: true, lastName: true } } },
    });
    REVALIDATE();
    return { success: true, comment };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// ── CREATE SUBTASK ───────────────────────────────────────────────────────────
export async function createSubtask(parentTaskId: string, title: string, isBlocking?: boolean) {
  try {
    const user = await requireAuth();
    const count = await (prisma as any).kanbanSubtask.count({ where: { parentTaskId } });
    const subtask = await (prisma as any).kanbanSubtask.create({
      data: { parentTaskId, title, completed: false, order: count, creatorId: user.id },
    });
    REVALIDATE();
    return { success: true, subtask };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// ── TOGGLE SUBTASK ───────────────────────────────────────────────────────────
export async function toggleSubtask(subtaskId: string, completed: boolean) {
  try {
    await requireAuth();
    const subtask = await (prisma as any).kanbanSubtask.update({ where: { id: subtaskId }, data: { completed } });
    REVALIDATE();
    return { success: true, subtask };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// ── DELETE SUBTASK ───────────────────────────────────────────────────────────
export async function deleteSubtask(subtaskId: string) {
  try {
    await requireAuth();
    await (prisma as any).kanbanSubtask.delete({ where: { id: subtaskId } });
    REVALIDATE();
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// ── GET TEAM MEMBERS ─────────────────────────────────────────────────────────
export async function getTeamMembersForAssignment() {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, users: [] };

    const cu = await prisma.companyUser.findFirst({ where: { userId: session.user.id }, select: { companyId: true } });
    if (!cu) return { success: false, users: [] };

    const companyUsers = await prisma.companyUser.findMany({
      where: { companyId: cu.companyId },
      include: { user: { select: { id: true, name: true, image: true, firstName: true, lastName: true, email: true } } },
    });
    return { success: true, users: companyUsers.map((c) => c.user) };
  } catch (err: any) {
    return { success: false, users: [] };
  }
}

// ── DUPLICATE TASK ───────────────────────────────────────────────────────────
export async function duplicateKanbanTask(taskId: string) {
  try {
    const user = await requireAuth();
    const original = await prisma.kanbanTask.findUnique({ where: { id: taskId } });
    if (!original) return { success: false, error: "Task not found" };

    const count = await prisma.kanbanTask.count({ where: { swimlaneId: original.swimlaneId, status: original.status } });
    const copy = await prisma.kanbanTask.create({
      data: {
        title: `${original.title} (copia)`, description: original.description,
        priority: original.priority, status: original.status,
        swimlaneId: original.swimlaneId, projectId: original.projectId,
        creatorId: user.id, assigneeId: original.assigneeId,
        dueDate: original.dueDate, estimatedHours: original.estimatedHours, order: count,
        labels: (original as any).labels || [],
      },
    });
    REVALIDATE();
    return { success: true, task: copy };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// ── ANALYTICS ───────────────────────────────────────────────────────────────
export async function getKanbanAnalytics(projectId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, data: null };

    const targetId = projectId === "default"
      ? (await prisma.kanbanProject.findFirst({}))?.id : projectId;
    if (!targetId) return { success: false, data: null };

    const tasks = await prisma.kanbanTask.findMany({
      where: { projectId: targetId },
      select: { id: true, status: true, priority: true, dueDate: true, estimatedHours: true, createdAt: true, updatedAt: true },
      orderBy: { createdAt: "asc" },
    });

    const now = new Date();
    const overdue = tasks.filter(t => t.dueDate && t.dueDate < now && t.status !== "DONE").length;
    const byStatus = tasks.reduce((a: any, t) => { a[t.status] = (a[t.status] || 0) + 1; return a; }, {});
    const byPriority = tasks.reduce((a: any, t) => { a[t.priority] = (a[t.priority] || 0) + 1; return a; }, {});
    const totalEstimated = tasks.reduce((s, t) => s + (t.estimatedHours || 0), 0);
    const completionRate = tasks.length > 0 ? Math.round(((byStatus["DONE"] || 0) / tasks.length) * 100) : 0;

    // Velocity: tasks completed per week for last 4 weeks
    const velocity: { week: string; count: number }[] = [];
    for (let i = 3; i >= 0; i--) {
      const weekStart = new Date(now);
      weekStart.setDate(weekStart.getDate() - i * 7 - weekStart.getDay());
      weekStart.setHours(0, 0, 0, 0);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 7);
      const count = tasks.filter(t => t.status === "DONE" && t.updatedAt >= weekStart && t.updatedAt < weekEnd).length;
      velocity.push({ week: weekStart.toLocaleDateString("es", { month: "short", day: "numeric" }), count });
    }

    // Cumulative flow: tasks created per day last 14 days
    const cumulativeFlow: { date: string; todo: number; inProgress: number; review: number; done: number }[] = [];
    for (let i = 13; i >= 0; i--) {
      const day = new Date(now);
      day.setDate(day.getDate() - i);
      day.setHours(23, 59, 59, 999);
      const dayStr = day.toLocaleDateString("es", { month: "short", day: "numeric" });
      const existingTasks = tasks.filter(t => new Date(t.createdAt) <= day);
      cumulativeFlow.push({
        date: dayStr,
        todo: existingTasks.filter(t => t.status === "TODO").length,
        inProgress: existingTasks.filter(t => t.status === "IN_PROGRESS").length,
        review: existingTasks.filter(t => t.status === "REVIEW").length,
        done: existingTasks.filter(t => t.status === "DONE").length,
      });
    }

    return { success: true, data: { total: tasks.length, overdue, byStatus, byPriority, totalEstimated, completionRate, velocity, cumulativeFlow } };
  } catch (err: any) {
    return { success: false, data: null };
  }
}

// ── LOG TIME SESSION ─────────────────────────────────────────────────────────
export async function logTimeSession(taskId: string, durationSeconds: number, note?: string) {
  try {
    const user = await requireAuth();
    // Store as a comment with special prefix for now (until timeLog model is added)
    const hours = durationSeconds / 3600;
    const mins = Math.floor((durationSeconds % 3600) / 60);
    const secs = durationSeconds % 60;
    const formatted = `${Math.floor(hours).toString().padStart(2,"0")}:${mins.toString().padStart(2,"0")}:${secs.toString().padStart(2,"0")}`;
    const content = `⏱ **Sesión de trabajo:** ${formatted}${note ? ` — ${note}` : ""}`;
    const comment = await (prisma as any).kanbanComment.create({
      data: { taskId, content, authorId: user.id },
      include: { author: { select: { id: true, name: true, image: true, firstName: true, lastName: true } } },
    });

    // Update estimated hours based on logged time (add to existing)
    await prisma.kanbanTask.update({
      where: { id: taskId },
      data: { estimatedHours: { increment: hours } },
    });

    REVALIDATE();
    return { success: true, comment };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// ── GENERATE CLIENT APPROVAL LINK ────────────────────────────────────────────
export async function generateClientApprovalLink(taskId: string) {
  try {
    await requireAuth();
    const token = randomBytes(32).toString("hex");
    // Store token in task metadata field or as a comment
    await prisma.kanbanTask.update({
      where: { id: taskId },
      data: { status: "REVIEW", updatedAt: new Date() },
    });
    // In a full implementation, store token in a separate table
    // For now, generate the URL pattern
    const approvalUrl = `${process.env.NEXT_PUBLIC_APP_URL || "https://legacymarksas.com"}/approve/${taskId}?token=${token}`;
    REVALIDATE();
    return { success: true, url: approvalUrl, token };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
