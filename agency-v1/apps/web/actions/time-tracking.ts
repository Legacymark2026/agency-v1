"use server";

import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

const GATEWAY_URL = process.env.API_GATEWAY_URL || "http://localhost:8080";

export async function logTimeEntry(
  durationSeconds: number,
  kanbanTaskId?: string
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    const durationHours = durationSeconds / 3600;

    const response = await fetch(`${GATEWAY_URL}/api/hr/time-entries`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: session.user.id,
        kanbanTaskId,
        duration: durationHours,
        startedAt: new Date(Date.now() - durationSeconds * 1000).toISOString(),
        endedAt: new Date().toISOString(),
      }),
    });

    const resData = await response.json();
    if (!response.ok) {
      return { success: false, error: resData.error || "Failed to save time entry" };
    }

    revalidatePath("/dashboard/admin/operations");
    return { success: true, data: resData.data };
  } catch (error) {
    console.error("Error logging time entry:", error);
    return { success: false, error: "Failed to save time entry" };
  }
}
