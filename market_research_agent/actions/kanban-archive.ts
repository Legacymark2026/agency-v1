"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

const REVALIDATE = () => revalidatePath("/dashboard/admin/operations/kanban");

/** Archive completed tasks older than X days */
export async function archiveCompletedTasks(projectId: string, olderThanDays = 30) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };

    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - olderThanDays);

    const result = await prisma.kanbanTask.updateMany({
      where: {
        projectId,
        status: "DONE",
        archived: false,
        updatedAt: { lt: cutoff },
      } as any,
      data: {
        archived: true,
        archivedAt: new Date(),
      } as any,
    });

    REVALIDATE();
    return { success: true, count: result.count };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/** Restore a single archived task */
export async function restoreTask(taskId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };

    await prisma.kanbanTask.update({
      where: { id: taskId },
      data: { archived: false, archivedAt: null, status: "TODO" } as any,
    });

    REVALIDATE();
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/** Get archived tasks for a project (paginated) */
export async function getArchivedTasks(projectId: string, page = 1, pageSize = 20) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, tasks: [] };

    const tasks = await prisma.kanbanTask.findMany({
      where: { projectId, archived: true } as any,
      select: {
        id: true, title: true, priority: true, archivedAt: true, updatedAt: true,
        assignee: { select: { id: true, name: true, image: true, firstName: true, lastName: true } },
      } as any,
      orderBy: { archivedAt: "desc" } as any,
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    const total = await prisma.kanbanTask.count({
      where: { projectId, archived: true } as any,
    });

    return { success: true, tasks, total, pages: Math.ceil(total / pageSize) };
  } catch (err: any) {
    return { success: false, tasks: [], total: 0 };
  }
}

/** Asset annotations */
export async function addAssetAnnotation(
  taskId: string,
  assetUrl: string,
  xPercent: number,
  yPercent: number,
  comment: string,
  timestamp?: number
) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };

    const annotation = await (prisma as any).kanbanAssetAnnotation.create({
      data: {
        taskId, assetUrl, xPercent, yPercent,
        comment, timestamp: timestamp || null,
        authorId: session.user.id,
      },
    });

    return { success: true, annotation };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function getAssetAnnotations(taskId: string, assetUrl: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, data: [] };

    const annotations = await (prisma as any).kanbanAssetAnnotation.findMany({
      where: { taskId, assetUrl },
      include: {
        author: { select: { id: true, name: true, image: true, firstName: true, lastName: true } },
      },
      orderBy: { createdAt: "asc" },
    });

    return { success: true, data: annotations };
  } catch (err: any) {
    return { success: false, data: [] };
  }
}

export async function resolveAnnotation(annotationId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };

    await (prisma as any).kanbanAssetAnnotation.update({
      where: { id: annotationId },
      data: { resolved: true },
    });

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
