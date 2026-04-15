"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

/** Full-text search across tasks, comments, subtask titles */
export async function globalKanbanSearch(query: string, projectId?: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, results: [] };

    if (!query || query.trim().length < 2) return { success: true, results: [] };
    const q = query.trim();

    // Tasks matching title or description
    const tasks = await prisma.kanbanTask.findMany({
      where: {
        archived: false,
        ...(projectId ? { projectId } : {}),
        OR: [
          { title: { contains: q, mode: "insensitive" } },
          { description: { contains: q, mode: "insensitive" } },
        ],
      } as any,
      select: {
        id: true, title: true, status: true, priority: true, projectId: true,
        project: { select: { name: true } },
      },
      take: 10,
    });

    // Comments matching content
    let commentMatches: any[] = [];
    try {
      commentMatches = await (prisma as any).kanbanComment.findMany({
        where: {
          content: { contains: q, mode: "insensitive" },
          task: { archived: false, ...(projectId ? { projectId } : {}) },
        },
        select: {
          id: true, content: true,
          task: { select: { id: true, title: true, projectId: true, project: { select: { name: true } } } },
        },
        take: 5,
      });
    } catch { /* table might not exist yet */ }

    // Subtasks matching title
    let subtaskMatches: any[] = [];
    try {
      subtaskMatches = await (prisma as any).kanbanSubtask.findMany({
        where: {
          title: { contains: q, mode: "insensitive" },
          parentTask: { archived: false, ...(projectId ? { projectId } : {}) },
        },
        select: {
          id: true, title: true,
          parentTask: { select: { id: true, title: true, projectId: true, project: { select: { name: true } } } },
        },
        take: 5,
      });
    } catch { /* table might not exist yet */ }

    const results = [
      ...tasks.map((t: any) => ({
        type: "task" as const,
        taskId: t.id,
        title: t.title,
        subtitle: `${t.project.name} · ${t.status}`,
        priority: t.priority,
      })),
      ...commentMatches.map((c: any) => ({
        type: "comment" as const,
        taskId: c.task.id,
        title: c.task.title,
        subtitle: `Comentario: "${c.content.substring(0, 50)}..."`,
        priority: null,
      })),
      ...subtaskMatches.map((s: any) => ({
        type: "subtask" as const,
        taskId: s.parentTask.id,
        title: s.parentTask.title,
        subtitle: `Subtarea: "${s.title}"`,
        priority: null,
      })),
    ];

    return { success: true, results: results.slice(0, 15) };
  } catch (err: any) {
    return { success: false, results: [], error: err.message };
  }
}
