"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function updateKanbanTaskPosition(
  taskId: string,
  newStatus: string,
  newSwimlaneId?: string
) {
  try {
    const dataToUpdate: any = {
      status: newStatus,
    };

    // Only update swimlane if it is explicitly moved
    if (newSwimlaneId !== undefined) {
      dataToUpdate.swimlaneId = newSwimlaneId;
    }

    const updatedTask = await prisma.kanbanTask.update({
      where: { id: taskId },
      data: dataToUpdate,
    });

    // Revalidate the operations page to ensure real-time consistency
    revalidatePath("/dashboard/admin/operations/kanban");
    
    return { success: true, task: updatedTask };
  } catch (error) {
    console.error("Error updating Kanban task position:", error);
    return { success: false, error: "Failed to update task position" };
  }
}
