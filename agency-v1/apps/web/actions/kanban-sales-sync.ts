"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

const GATEWAY_URL = process.env.API_GATEWAY_URL || "http://localhost:8080";

async function requireAuth() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  return session.user;
}

export async function convertTaskToDeal(taskId: string, dealValue: number) {
  try {
    const user = await requireAuth();
    const cuRes = await fetch(`${GATEWAY_URL}/api/crm/users/${user.id}/company`);
    const cuData = await cuRes.json();
    if (!cuRes.ok || !cuData.data) throw new Error("No company linked");
    const companyId = cuData.data.companyId;

    const task = await (prisma as any).kanbanTask.findUnique({
      where: { id: taskId, project: { companyId } },
      include: { deal: true }
    });

    if (!task) return { success: false, error: "Task not found" };
    if (task.deal) return { success: false, error: "Task already linked to a Deal" };

    const res = await fetch(`${GATEWAY_URL}/api/deals`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        companyId,
        title: `Deal: ${task.title}`,
        value: dealValue,
        kanbanTaskId: task.id,
        assignedTo: task.assigneeId,
        stage: "NEW",
        probability: task.status === "DONE" ? 100 : task.status === "IN_PROGRESS" ? 50 : 10
      })
    });
    const resData = await res.json();
    if (!res.ok) throw new Error(resData.error || "Failed to create deal");

    revalidatePath("/dashboard/admin/operations/kanban");
    return { success: true, deal: resData };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
