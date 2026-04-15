"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

async function requireAuth() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  return session.user;
}

export async function convertTaskToDeal(taskId: string, dealValue: number) {
  try {
    const user = await requireAuth();
    const cu = await prisma.companyUser.findFirst({ where: { userId: user.id }});
    if (!cu) throw new Error("No company linked");

    const task = await (prisma as any).kanbanTask.findUnique({
      where: { id: taskId, project: { companyId: cu.companyId } },
      include: { deal: true }
    });

    if (!task) return { success: false, error: "Task not found" };
    if (task.deal) return { success: false, error: "Task already linked to a Deal" };

    const deal = await (prisma as any).deal.create({
      data: {
        companyId: cu.companyId,
        title: `Deal: ${task.title}`,
        value: dealValue,
        kanbanTaskId: task.id,
        assignedTo: task.assigneeId,
        stage: "NEW",
        probability: task.status === "DONE" ? 100 : task.status === "IN_PROGRESS" ? 50 : 10
      }
    });

    revalidatePath("/dashboard/admin/operations/kanban");
    return { success: true, deal };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
