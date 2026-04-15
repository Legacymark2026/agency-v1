"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function logTimeEntry(
  durationSeconds: number,
  kanbanTaskId?: string
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    // Default to the first found kanban task just for demo purposes if not provided
    // In a real scenario, this requires the user to pick the task.
    let targetTaskId = kanbanTaskId;
    if (!targetTaskId) {
      const firstTask = await prisma.kanbanTask.findFirst();
      if (firstTask) targetTaskId = firstTask.id;
    }

    if (!targetTaskId) {
       return { success: false, error: "No active task available to log time against." };
    }

    const durationHours = durationSeconds / 3600;

    const timeEntry = await prisma.timeEntry.create({
      data: {
        userId: session.user.id,
        kanbanTaskId: targetTaskId,
        duration: durationHours,
        startedAt: new Date(Date.now() - durationSeconds * 1000), // Backdate start time
        endedAt: new Date(),
      },
    });

    revalidatePath("/dashboard/admin/operations");
    return { success: true, data: timeEntry };
  } catch (error) {
    console.error("Error logging time entry:", error);
    return { success: false, error: "Failed to save time entry" };
  }
}
